import * as WebSocket from 'websocket';
import {Server} from 'http';
import WebSocketEvent from "../interface/web-socket-event";
import {distinctUntilChanged, filter, scan} from "rxjs/operators";
import {Observable} from "rxjs/internal/Observable";
import {Subject} from "rxjs/internal/Subject";
import Logger from "./logger";
import {AddressInfo} from "net";
import {Command} from "../interface/command";
import WrongEncodingError from "../error/wrong-encoding-error";

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
     * @type {Subject<Command>}
     * @access private
     */
    private commands$: Subject<Command>;

    /**
     * @type {Subject<WebSocket.connection>}
     * @access private
     */
    private connections$: Subject<WebSocket.connection>;

    /**
     * @type {string}
     * @access private
     */
    private static namespace = `web-socket`;

    /**
     * @constructor
     * @param {module:http.Server} httpServer
     */
    constructor( httpServer: Server ) {
        this.httpServer = httpServer;
        this.connections$ = new Subject<WebSocket.connection>();
        this.commands$ = new Subject<Command>();

        this.createWebSocketServer();
    }

    /**
     * @access private
     */
    private createWebSocketServer(): void {
        this.webSocketServer = new WebSocket.server( {
            httpServer: this.httpServer
        } );

        Logger.info( WebSocketService.namespace, `Listening on port ${ JSON.stringify( ( <AddressInfo>this.httpServer.address() ).port ) }.` );
        this.webSocketServer.on( 'request', this.handleRequestReceived.bind( this ) );
    }

    /**
     * Handles new WebSocket connection requests
     * @access private
     * @param {request} request
     */
    private handleRequestReceived( request: WebSocket.request ): void {
        const connection = request.accept( null, request.origin );

        Logger.info( WebSocketService.namespace, `Client connected via ${ request.origin }` );
        this.connections$.next( connection );

        // todo: clear listeners on disconnect?
        connection.on( 'message', message => {
            if ( message.type !== "utf8" ) throw new WrongEncodingError( `Received WebSocket message in unsupported format` );
            const command = JSON.parse( message.utf8Data );
            this.commands$.next( command );
        } );

        connection.on( 'close', ( reasonCode: number, description: string ) => {
            Logger.info( WebSocketService.namespace, `Connection to a client was lost because of: ${ description }` );
        } );
    }

    /**
     * @access public
     * @return {Observable<connection[]>}
     */
    public get allClients(): Observable<WebSocket.connection[]> {
        return this.connections$.pipe(
            filter( ( connection: WebSocket.connection ) => connection !== null ),
            scan( ( acc: WebSocket.connection[], cur: WebSocket.connection ) => [...acc, cur], [] ),
            distinctUntilChanged()
        );
    }

    /**
     * @access public
     * @return {Observable<Command>}
     */
    public get handleCommandReceived(): Observable<Command> {
        return this.commands$.pipe(
            filter( ( command: Command ) => command.method !== null ),
            distinctUntilChanged()
        );
    }

    /**
     * @access public
     * @return {Observable<WebSocket.connection>}
     */
    public get newClient(): Observable<WebSocket.connection> {
        return this.connections$.pipe(
            filter( ( connection: WebSocket.connection ) => connection !== null ),
            distinctUntilChanged()
        );
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