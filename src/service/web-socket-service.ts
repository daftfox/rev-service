import * as WebSocket from 'websocket';
import {createServer, Server} from 'http';
import WebSocketMessage, {
    WebSocketMessageKind,
    WebSocketMessageType
} from "../domain/web-socket-message/web-socket-message";
import LoggerService from "./logger-service";
import Boards from "../model/boards";
import Chalk from 'chalk';
import ICommand from "../domain/interface/command";
import IBoardRequest, { BoardAction } from "../domain/web-socket-message/body/board-request";
import IBoardResponse from "../domain/web-socket-message/body/board-response";
import { ResponseCode } from "../domain/web-socket-message/response-code";
import ICommandRequest from "../domain/web-socket-message/body/command-request";
import IProgramResponse from "../domain/web-socket-message/body/program-response";
import IProgramRequest, { ProgramAction } from "../domain/web-socket-message/body/program-request";
import Programs from "../model/programs";
import IBoardBroadcast, { BOARD_BROADCAST_ACTION } from "../domain/web-socket-message/body/board-broadcast";
import IErrorResponse from "../domain/web-socket-message/body/error-response";
import BadRequest from "../domain/web-socket-message/error/bad-request";
import NotFound from "../domain/web-socket-message/error/not-found";
import MethodNotAllowed from "../domain/web-socket-message/error/method-not-allowed";
import IBoard from "../domain/interface/board";
import IWebSocketOptions from "../domain/interface/web-socket-options";
import {
    CommandUnavailableError,
    CommandMalformedError
} from '../error/errors';

/**
 * @description Service that allows clients to interface using a near real-time web socket connection
 * @namespace WebSocketService
 */
class WebSocketService {

    /**
     * @static
     * @type {string}
     * @access private
     */
    private static namespace = `web-socket`;

    /**
     * @static
     * @type LoggerService
     * @access private
     */
    private static log = new LoggerService( WebSocketService.namespace );

    /**
     * @type {WebSocket.server}
     * @access private
     */
    private webSocketServer: WebSocket.server;

    private httpServer: Server;

    /**
     * @type {Boards}
     * @access private
     */
    private boardModel: Boards;

    /**
     * @type {Programs}
     * @access private
     */
    private programModel: Programs;

    /**
     * @constructor
     * @param {number} port - The port of which to accept WebSocket connection requests.
     * @param {Boards} boardModel - The {@link Board} instances model.
     * @param {Programs} programModel - The {@link Programs} instances model.
     */
    constructor( options: IWebSocketOptions ) {
        this.boardModel = options.boardModel;
        this.programModel = options.programModel;

        this.boardModel.addBoardConnectedListener( this.broadcastBoardConnected );
        this.boardModel.addBoardUpdatedListener( this.broadcastBoardUpdated );
        this.boardModel.addBoardDisconnectedListener( this.broadcastBoardDisconnected );

        this.startWebSocketServer( options.port );
    }

    /**
     * Send a response message to a specific client.
     *
     * @static
     * @access private
     * @param {WebSocket.connection} client - The client to send the message to.
     * @param {WebSocketMessage} response - The response message to send to the client.
     * @return {void}
     */
    private static sendResponse( client: WebSocket.connection, response: WebSocketMessage<any> ): void {
        client.sendUTF( response.toJSON() );
    }

    /**
     * Construct an instance of {@link WebSocketMessage} with the provided parameters.
     *
     * @static
     * @access private
     * @param {WebSocketMessageType} type - The type of {@link WebSocketMessage} to construct.
     * @param {string} requestId - The ID the message to construct is a response to.
     * @param {ResponseCode} responseCode - HTTP response code.
     * @param {any} body - The body to add to the payload.
     * @return {WebSocketMessage<T>} The instance of {@link WebSocketMessage} that was constructed.
     */
    private static getWebSocketMessageResponse<T>( type: WebSocketMessageType, requestId: string, responseCode: ResponseCode, body?: any ): WebSocketMessage<T> {
        return new WebSocketMessage<T>(
            WebSocketMessageKind.RESPONSE,
            type,
            body,
            requestId,
            responseCode );
    }

    /**
     * Construct an instance of {@link WebSocketMessage} with the provided parameters.
     *
     * @static
     * @access private
     * @param {WebSocketMessageType} type - The type of {@link WebSocketMessage} to construct.
     * @param {any} body - The body to add to the payload.
     * @return {WebSocketMessage<T>} The instance of {@link WebSocketMessage} that was constructed.
     */
    private static getWebSocketMessageBroadcast<T>( type: WebSocketMessageType, body?: any ): WebSocketMessage<T> {
        return new WebSocketMessage<T>(
            WebSocketMessageKind.BROADCAST,
            type,
            body );
    }

    /**
     * Construct an instance of {@link WebSocketMessage} containing details about the nature of the error.
     *
     * @static
     * @access private
     * @param {string} requestId - The ID the error message to construct is a response to.
     * @param {ResponseCode} code - HTTP response code.
     * @return {WebSocketMessage<undefined>} The instance of {@link WebSocketMessage} that was constructed.
     */
    private static getEmptyWebSocketMessageResponse( requestId: string, code: ResponseCode ): WebSocketMessage<undefined> {
        return WebSocketService.getWebSocketMessageResponse<undefined>(
            WebSocketMessageType.EMPTY_RESPONSE,
            requestId,
            code );
    }

    /**
     * Start the WebSocket server
     *
     * @access private
     * @return {void}
     */
    private startWebSocketServer( port: number ): void {
        this.httpServer = createServer().listen( port );
        this.webSocketServer = new WebSocket.server( {
            httpServer: this.httpServer,
        } );

        WebSocketService.log.info( `Listening on port ${ Chalk.rgb( 240, 240, 30 ).bold( JSON.stringify( ( port ) ) ) }.` );
        this.webSocketServer.on( 'request', this.handleConnectionRequest );
    }

    public closeServer(): void {
        this.webSocketServer.shutDown();
        this.httpServer.close();
    }

    /**
     * Handles new WebSocket connection requests.
     *
     * @access private
     * @param {WebSocket.request} request - The connection request that was received
     * @return {void}
     */
    private handleConnectionRequest = ( request: WebSocket.request ): void => {
        let client = request.accept( undefined, request.origin );

        this.handleClientConnected()
            .then( response => WebSocketService.sendResponse( client, response ) );

        client.on( 'message', ( message: { type: string, utf8Data: any } ) => {
            this.handleMessageReceived( message )
                .then( response => WebSocketService.sendResponse( client, response ) );
        } );

        client.on( 'close', () => {
            client = undefined;
        } );
    };

    /**
     * Handles received WebSocket requests and routes it to the corresponding method to construct the response.
     *
     * @async
     * @access private
     * @param {{ type: string, utf8Data: any }} message -
     * @return {Promise<WebSocketMessage<any>>} Promise resolving to a response in the shape of an instance of WebSocketMessage.
     */
    private handleMessageReceived = async ( message: { type: string, utf8Data: any } ): Promise<WebSocketMessage<any>> => {
        if ( message.type !== "utf8" ) {
            WebSocketService.log.warn( 'Message received in wrong encoding format. Supported format is utf8' );
        }

        const request = WebSocketMessage.fromJSON( message.utf8Data );
        let result: { body?: any, code: ResponseCode };
        let response: WebSocketMessage<any>;

        try {
            switch ( request.type ) {
                case WebSocketMessageType.BOARD_REQUEST:
                    result = await this.handleBoardRequest( request as WebSocketMessage<IBoardRequest> );
                    response = WebSocketService.getWebSocketMessageResponse<IBoardResponse>(
                        WebSocketMessageType.BOARD_RESPONSE,
                        request.id,
                        result.code,
                        result.body );
                    break;

                case WebSocketMessageType.COMMAND_REQUEST:
                    result = await this.handleCommandRequest( request as WebSocketMessage<ICommandRequest> );
                    break;

                case WebSocketMessageType.PROGRAM_REQUEST:
                    result = await this.handleProgramRequest( request as WebSocketMessage<IProgramRequest> );

                    if ( result.code === ResponseCode.OK || result.code === ResponseCode.CREATED ) {
                        response = WebSocketService.getWebSocketMessageResponse<IProgramResponse>(
                            WebSocketMessageType.PROGRAM_RESPONSE,
                            request.id,
                            result.code,
                            result.body );
                    }
                    break;
            }

            if ( result.code === ResponseCode.NO_CONTENT ) {
                response = WebSocketService.getEmptyWebSocketMessageResponse(
                    request.id,
                    result.code );
            }

        } catch ( error ) {
            response = WebSocketService.getWebSocketMessageResponse<IErrorResponse>(
                WebSocketMessageType.ERROR_RESPONSE,
                request.id,
                error.code,
                error.responseBody );
        }

        return Promise.resolve( response );
    };

    /**
     * Process a {@link IProgramRequest} and return an object containing a body property of type {@link IProgramResponse} and a code property of type {@link ResponseCode}.
     * If the requested action did not produce a body, the returned type of body is undefined.
     *
     * @access private
     * @param {WebSocketMessage<IProgramRequest>} request - The request body to process.
     * @return {Promise<{ body: IProgramResponse | undefined, code: ResponseCode }>} Promise that resolves to an object containing a body property of type {@link IProgramResponse} and a code property of type {@link ResponseCode}.
     */
    private handleProgramRequest( request: WebSocketMessage<IProgramRequest> ): Promise<{ body: IProgramResponse | undefined, code: ResponseCode }> {
        return new Promise( ( resolve, reject ) => {
            const result: {
                body: IProgramResponse,
                code: ResponseCode
            } = {
                body: {},
                code: ResponseCode.OK,
            };

            switch( request.body.action ) {

                case ProgramAction.EXECUTE:
                    // execute program
                    this.programModel.getProgramById( request.body.programId )
                        .then( program => {
                            this.boardModel.executeProgramOnBoard( request.body.boardId, program, request.body.repeat )
                                .catch( reject );

                            // send back a response as soon as the program has started executing so we can handle errors that might pop up in the meantime.
                            setTimeout( () => {
                                result.code = ResponseCode.NO_CONTENT;
                                resolve( result );
                            } );
                        } );
                    break;

                case ProgramAction.STOP:
                    // stop program execution
                    this.boardModel.stopProgram( request.body.boardId );
                    result.code = ResponseCode.NO_CONTENT;
                    break;

                case ProgramAction.REQUEST:
                    // request program(s)

                    if ( request.body.programId ) {
                        // by id
                        this.programModel.getProgramById( request.body.programId )
                            .catch( reject )
                            .then( program => {
                                Object.assign( result.body, { programs: [ program ] } );
                                resolve( result );
                            } );


                    } else {
                        // all programs
                        this.programModel.programs
                            .then( programs => {
                                Object.assign( result.body, { programs } );
                                resolve( result );
                            } );
                    }
                    break;

                case ProgramAction.CREATE:
                    // add a new program
                    this.programModel.addProgram( request.body.program )
                        .catch( reject )
                        .then( id => {
                            Object.assign( result, { body: { programId: id }, code: ResponseCode.CREATED } );
                            resolve( result );
                        } );

                    break;

                case ProgramAction.UPDATE:
                    // update existing program
                    this.programModel.updateProgram( request.body.programId, request.body.program )
                        .then( () => {
                            result.code = ResponseCode.NO_CONTENT;
                            resolve( result );
                        } );

                    break;

                case ProgramAction.DELETE:
                    // remove existing program
                    this.programModel.removeProgram( request.body.programId )
                        .catch( error => {
                            reject( error );
                        })
                        .then( () => {
                            result.code = ResponseCode.NO_CONTENT;
                            resolve( result );
                        } );
                    break;

                default:
                    // action missing from body
                    reject( new BadRequest( `Body property 'program' missing.` ) );
            }

        } );
    }

    /**
     * Process a {@link ICommandRequest} and return an object containing a code property of type {@link ResponseCode}.
     *
     * @access private
     * @param {WebSocketMessage<ICommandRequest>} request - The request body to process.
     * @return {Promise<{code: ResponseCode}>} Promise that resolves to an object with a code property of type {@link ResponseCode}.
     */
    private handleCommandRequest( request: WebSocketMessage<ICommandRequest> ): Promise<{code: ResponseCode}> {
        return new Promise( ( resolve, reject ) => {
            const result = {
                code: ResponseCode.NO_CONTENT
            };

            const board = this.boardModel.getBoardById( request.body.boardId );
            const command: ICommand = { action: request.body.action, parameters: request.body.parameters };

            if ( !board ) {
                // no board with that ID found
                reject( new NotFound( `Board with id ${request.body.boardId} could not be found.` ) );
            } else {
                this.boardModel.executeActionOnBoard( board.id, command )
                    .catch( ( error ) => {
                        if ( error instanceof CommandMalformedError ) {
                            // command is (likely) missing parameters
                            reject( new BadRequest( error.message ) );
                        } else if ( error instanceof CommandUnavailableError ) {
                            // board does not support this command
                            reject( new MethodNotAllowed( error.message ) );
                        } else {
                            reject( error );
                        }

                    } )
                    .then( () => {
                        // command executed successfully
                        resolve( result );
                    } );
            }
        } );
    }

    /**
     * Process a {@link IProgramRequest} and return an object containing a body property of type {@link IBoardResponse} and a code property of type {@link ResponseCode}.
     * If the requested action did not produce a body, the returned type of body is undefined.
     *
     * @access private
     * @param {WebSocketMessage} request - The request body to process.
     * @return {WebSocketMessage<IBoardResponse>} Promise resolving to an object containing a body property of type {@link IBoardResponse} and a code property of type {@link ResponseCode}.
     */
    private handleBoardRequest( request: WebSocketMessage<IBoardRequest> ): Promise<{ body: IBoardResponse | undefined, code: ResponseCode }> {
        return new Promise( ( resolve, reject ) => {
            const result: {
                body: IBoardResponse,
                code: ResponseCode
            } = {
                body: {
                    boards: [],
                },
                code: ResponseCode.OK,
            };

            if ( request.body.action === BoardAction.REQUEST ) {

                if ( request.body.boardId ) {
                    // request single board
                    const board = this.boardModel.getBoardById( request.body.boardId );

                    if ( !board ) {
                        reject( new NotFound( `Board with id ${request.body.boardId} could not be found.` ) );
                    } else {
                        Object.assign( result.body, { boards: [ board ] } );
                    }

                } else {
                    // request all boards
                    Object.assign( result.body, { boards: this.boardModel.boards } );
                }

            } else if ( request.body.action === BoardAction.UPDATE ) {
                // board update
                this.boardModel.updateBoard( request.body.board, true );
                result.code = ResponseCode.NO_CONTENT;
            } else {

                // illegal action
                reject( new BadRequest( `Only actions ${BoardAction.REQUEST} and ${BoardAction.UPDATE} are allowed.` ) );
            }

            resolve( result );
        } );
    }

    /**
     * Send newly connected client a list of all known boards (online or not).
     *
     * @access private
     * @return {Promise<WebSocketMessage<IBoardBroadcast>>} Promise resolving to an instance of {@link WebSocketMessage<IBoardBroadcast>}
     */
    private handleClientConnected(): Promise<WebSocketMessage<IBoardBroadcast>> {
        return new Promise( ( resolve ) => {
            const body: IBoardBroadcast = {
                action: BOARD_BROADCAST_ACTION.REPLACE,
                boards: this.boardModel.boards,
            };

            resolve( new WebSocketMessage<IBoardBroadcast>( WebSocketMessageKind.BROADCAST, WebSocketMessageType.BOARD_BROADCAST, body ) );
        } );
    }

    /**
     * Broadcast an update with the newly connected board to connected clients.
     *
     * @access private
     * @param {IBoard} board - The board that was connected
     * @return {void}
     */
    private broadcastBoardConnected = ( board: IBoard, newRecord: boolean ): void => {
        this.broadcastBoardUpdate( ( newRecord ? BOARD_BROADCAST_ACTION.NEW : BOARD_BROADCAST_ACTION.UPDATE ), board );
    };

    /**
     * Broadcast the updated board to all connected clients.
     *
     * @access private
     * @param {IBoard} board - The board that was updated.
     * @return {void}
     */
    private broadcastBoardUpdated = ( board: IBoard ): void => {
        this.broadcastBoardUpdate( BOARD_BROADCAST_ACTION.UPDATE, board );
    };

    /**
     * Broadcast an update with the disconnected board to connected clients.
     *
     * @access private
     * @param {IBoard} board - The board that has disconnected.
     * @return {void}
     */
    private broadcastBoardDisconnected = ( board: IBoard ): void => {
        this.broadcastBoardUpdate( BOARD_BROADCAST_ACTION.UPDATE, board );
    };

    /**
     * Broadcast a board property or status update.
     *
     * @access private
     * @param {BOARD_BROADCAST_ACTION} action - The type of update.
     * @param {IBoard} board - The board whose properties or status have updated.
     * @return {void}
     */
    private broadcastBoardUpdate = ( action: BOARD_BROADCAST_ACTION, board: IBoard ): void => {
        const body: IBoardBroadcast = {
            action,
            boards: [ board ],
        };

        const message = WebSocketService.getWebSocketMessageBroadcast<IBoardBroadcast>( WebSocketMessageType.BOARD_BROADCAST, body );

        this.broadcast( message );
    };

    /**
     * Broadcast a message to all connected clients.
     *
     * @access private
     * @param {WebSocketMessage<any>} message - The {@link WebSocketMessage} to broadcast to connected clients.
     * @return {void}
     */
    private broadcast( message: WebSocketMessage<any> ): void {
        this.webSocketServer.broadcastUTF( message.toJSON() );
    }
}

export default WebSocketService;
