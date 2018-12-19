import * as WebSocket from 'websocket';
import Debugger from 'debug';
import { createServer, Server } from 'http';
import WebSocketEvent from "../interface/web-socket-event";
import {distinctUntilChanged, filter, scan} from "rxjs/operators";
import {Observable} from "rxjs/internal/Observable";
import {Subject} from "rxjs/internal/Subject";

class WebSocketService {
    private port:            number;
    private httpServer:      Server;
    private webSocketServer: WebSocket.server;
    private debug:           Debugger;
    private connections$:    Subject<WebSocket.connection>;

    constructor( port ) {
        this.port         = port;
        this.debug        = Debugger.debug( 'WebSocket' );
        this.connections$ = new Subject<WebSocket.connection>();

        this.createHttpServer();
        this.createWebSocketServer();
    }

    private createHttpServer() {
        this.httpServer = createServer();

        this.httpServer.listen( this.port, () => {
            this.debug( `Listening on port ${this.port}.` );
        } );
    }

    private createWebSocketServer() {
        this.webSocketServer = new WebSocket.server( {
            httpServer: this.httpServer
        } );

        this.webSocketServer.on( 'request', this.handleRequestReceived.bind(this) );
    }

    private handleRequestReceived( request: WebSocket.request ) {
        const connection = request.accept( null, request.origin );

        this.debug( `Client connected via ${request.origin}` );
        this.connections$.next( connection );

        connection.on( 'message', message => {
            if ( message.type === "utf8" ) {

            } else if ( message.type === "binary" ) {

            }
        } );

        connection.on( 'close', ( reasonCode: number, description: string ) => {
            this.debug( `Connection to a client was lost because of: ${description}` );

        } );
    }

    public get allClients(): Observable<WebSocket.connection[]> {
        return this.connections$.pipe(
            filter( ( connection: WebSocket.connection ) => connection !== null ),
            scan( ( acc: WebSocket.connection[], cur: WebSocket.connection ) => [...acc, cur], [] ),
            distinctUntilChanged()
        );
    }

    public get newClient(): Observable<WebSocket.connection> {
        return this.connections$.pipe(
            filter( ( connection: WebSocket.connection ) => connection !== null ),
            distinctUntilChanged()
        );
    }

    public broadcastEvent( event: WebSocketEvent ) {
        this.webSocketServer.broadcastUTF( event.toString() );
        //this.webSocketServer.broadcastUTF( event.toString() );
    }

    public sendEvent( connection: WebSocket.connection, event: WebSocketEvent ) {
        connection.sendUTF( event.toString() );
    }
}

export default WebSocketService;