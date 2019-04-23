import * as WebSocket from 'websocket';
import { Server } from 'http';
import WebSocketMessage from "../domain/web-socket-message";
import Logger from "./logger";
import { AddressInfo } from "net";
import ICommandEvent from "../interface/command-event";
import Boards from "../model/boards";
import HttpService from "./http-service";
import Board from "../domain/board";
import Chalk from 'chalk';
import { WebSocketMessageType } from "../domain/web-socket-message";
import { BoardActionType } from "../interface/board-event";
import IBoard from "../interface/board";
import CommandService from "./command-service";
import ICommand from "../interface/command";

/**
 * @classdesc Service that allows clients to interface using a near real-time web socket connection
 * @namespace WebSocketService
 */
class WebSocketService {

    /**
     * @type {module:http.Server}
     * @access private
     */
    private httpServer: Server;

    /**
     * @type {WebSocket.server}
     * @access private
     */
    private webSocketServer: WebSocket.server;

    /**
     * @type {Boards}
     * @access private
     */
    private model: Boards;

    /**
     * @type {string}
     * @access private
     */
    private static namespace = `web-socket`;

    private log = new Logger( WebSocketService.namespace );

    private commandService: CommandService;

    /**
     * @constructor
     * @param {number} port
     * @param {port} model
     */
    constructor( port: number, model: Boards ) {
        this.httpServer = new HttpService( port ).server;

        this.model = model;

        this.model.addBoardConnectedListener( this.broadcastBoardConnected.bind( this ) );
        this.model.addBoardUpdatedListener( this.broadcastBoardUpdated.bind( this ) );
        this.model.addBoardDisconnectedListener( this.broadcastBoardDisconnected.bind( this ) );

        this.startWebSocketServer();
    }

    /**
     * Start the WebSocket server
     * @access private
     */
    private startWebSocketServer(): void {
        this.webSocketServer = new WebSocket.server( {
            httpServer: this.httpServer
        } );

        this.log.info( `Listening on port ${ Chalk.rgb( 240, 240, 30 ).bold( JSON.stringify( ( <AddressInfo>this.httpServer.address() ).port ) ) }.` );
        this.webSocketServer.on( 'request', this.handleConnectionRequest.bind( this ) );
    }

    /**
     * Handles new WebSocket connection requests
     * @access private
     * @param {request} request
     */
    private handleConnectionRequest( request: WebSocket.request ): void {
        let connection = request.accept( null, request.origin );

        this.handleClientConnected( connection );

        connection.on( 'message', this.handleMessageReceived.bind( this ) );
        connection.on( 'close', () => {
            connection = null;
        } );
    }

    private handleMessageReceived( message: { type: string, utf8Data: any } ): void {
        if ( message.type !== "utf8" ) this.log.warn( 'Message received in wrong encoding format. Supported format is utf8' );

        const webSocketMessage = <WebSocketMessage> JSON.parse( message.utf8Data );
        switch ( webSocketMessage.type ) {
            case WebSocketMessageType.COMMAND_EVENT:
                const board = this.model.getBoardById( (<ICommandEvent> webSocketMessage.payload ).boardId );
                const command: ICommand = { action: ( <ICommandEvent> webSocketMessage.payload ).action, parameter: ( <ICommandEvent> webSocketMessage.payload ).parameter };
                CommandService.executeCommand( board, command );
                break;
        }
    }

    /**
     * @access public
     * @param {WebSocket.connection} client
     * @return {void}
     */
    public handleClientConnected( client: WebSocket.connection ): void {
        this.sendEvent(
            client,
            new WebSocketMessage(
                WebSocketMessageType.BOARD_EVENT,
                {
                    action: BoardActionType.UPDATE_ALL,
                    data: <IBoard[]> Board.toDiscreteArray( this.model.boards )
                }
            )
        );
    }

    /**
     * Broadcast an update with the newly connected board to connected clients.
     * @access private
     * @param {Board} board The board that was connected
     */
    private broadcastBoardConnected( board: Board ): void {
        this.broadcastEvent(
            new WebSocketMessage(
                WebSocketMessageType.BOARD_EVENT,
                {
                    action: BoardActionType.ADD,
                    data: <IBoard[]> [ Board.toDiscrete( board ) ]
                }
            )
        );
    }

    private broadcastBoardUpdated( board: Board ): void {
        this.broadcastEvent(
            new WebSocketMessage(
                WebSocketMessageType.BOARD_EVENT,
                {
                    action: BoardActionType.UPDATE,
                    data: <IBoard[]> [ Board.toDiscrete( board ) ]
                }
            )
        );
    }

    /**
     * Broadcast an update with the disconnected board to connected clients.
     * @access private
     * @param {Board} board
     */
    private broadcastBoardDisconnected( board: Board ): void {
        this.broadcastEvent(
            new WebSocketMessage(
                WebSocketMessageType.BOARD_EVENT,
                {
                    action: BoardActionType.REMOVE,
                    data: <IBoard[]> [ Board.toDiscrete( board ) ]
                }
            )
        );
    }

    /**
     * @access public
     * @param {WebSocketMessage} event
     */
    public broadcastEvent( event: WebSocketMessage ): void {
        this.webSocketServer.broadcastUTF( event.toString() );
    }

    /**
     * @access public
     * @param {connection} connection
     * @param {WebSocketMessage} event
     */
    public sendEvent( connection: WebSocket.connection, event: WebSocketMessage ): void {
        connection.sendUTF( event.toString() );
    }
}

export default WebSocketService;