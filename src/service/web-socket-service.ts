import * as WebSocket from 'websocket';
import {Server} from 'http';
import WebSocketEvent, {WebSocketEventType} from "../interface/web-socket-event";
import Logger from "./logger";
import {AddressInfo} from "net";
import {Command} from "../interface/command";
import WrongEncodingError from "../error/wrong-encoding-error";
import Boards from "../model/boards";
import HttpService from "./http-service";
import Board from "../domain/board";

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

    /**
     * @constructor
     * @param {number} port
     * @param {port} model
     */
    constructor( port: number, model: Boards ) {
        this.httpServer = new HttpService( port ).server;

        this.model = model;
        this.model.addBoardConnectedListener( this.broadcastBoardConnected.bind( this ) );
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

        Logger.info( WebSocketService.namespace, `Listening on port ${ JSON.stringify( ( <AddressInfo>this.httpServer.address() ).port ) }.` );
        this.webSocketServer.on( 'request', this.handleConnectionRequest.bind( this ) );
    }

    /**
     * Handles new WebSocket connection requests
     * @access private
     * @param {request} request
     */
    private handleConnectionRequest( request: WebSocket.request ): void {
        let connection = request.accept( null, request.origin );

        Logger.info( WebSocketService.namespace, `Client connected via ${ request.origin }` );
        this.handleClientConnected( connection );

        connection.on( 'message', this.handleMessage.bind( this ) );
        connection.on( 'close', ( reasonCode: number, description: string ) => {
            connection = null;
            Logger.info( WebSocketService.namespace, `Connection to a client was lost because of: ${ description }` );
        } );
    }

    private handleMessage( message: any ): void {
        if ( message.type !== "utf8" ) throw new WrongEncodingError( `Received WebSocket message in unsupported format` );
        try {
            const command = <Command>JSON.parse( message.utf8Data );
            this.model.executeCommand( command );
        } catch( err ) {
            Logger.error( WebSocketService.namespace, err );
        }
    }

    /**
     * @access public
     * @param {WebSocket.connection} client
     * @return {void}
     */
    public handleClientConnected( client: WebSocket.connection ): void {
        this.sendEvent( client, new WebSocketEvent( WebSocketEventType.UPDATE_ALL_BOARDS, Board.toDiscreteArray( this.model.boards ) ) );
    }

    /**
     * Broadcast an update with the newly connected board to connected clients.
     * @access private
     * @param {Board} board The board that was connected
     */
    private broadcastBoardConnected( board: Board ): void {
        this.broadcastEvent( new WebSocketEvent( WebSocketEventType.ADD_BOARD, Board.toDiscrete( board ) ) );
    }

    /**
     * Broadcast an update with the disconnected board to connected clients.
     * @access private
     * @param {Board} board
     */
    private broadcastBoardDisconnected( board: Board ): void {
        this.broadcastEvent( new WebSocketEvent( WebSocketEventType.REMOVE_BOARD, Board.toDiscrete( board ) ) );
    }

    /**
     * @access public
     * @param {WebSocketEvent} event
     */
    public broadcastEvent( event: WebSocketEvent ): void {
        this.webSocketServer.broadcastUTF( event.toString() );
    }

    /**
     * @access public
     * @param {connection} connection
     * @param {WebSocketEvent} event
     */
    public sendEvent( connection: WebSocket.connection, event: WebSocketEvent ): void {
        connection.sendUTF( event.toString() );
    }
}

export default WebSocketService;