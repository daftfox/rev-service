import * as WebSocket from 'websocket';
import {Server} from 'http';
import WebSocketEvent from "../interface/web-socket-event";
import {distinctUntilChanged, filter, scan} from "rxjs/operators";
import {Observable} from "rxjs/internal/Observable";
import {Subject} from "rxjs/internal/Subject";
import Logger from "./logger";
import {AddressInfo} from "net";

class WebSocketService {
    private httpServer:      Server;
    private webSocketServer: WebSocket.server;
    private execs$:          Subject<{ id: string, command: string, parameter?: string }>;
    private connections$:    Subject<WebSocket.connection>;
    private static namespace = `web-socket`;

    constructor( httpServer: Server ) {
        this.httpServer = httpServer;
        this.connections$ = new Subject<WebSocket.connection>();
        this.execs$ = new Subject<{ id: string, command: string, parameter?: string }>();

        this.createWebSocketServer();
    }

    private createWebSocketServer(): void {
        this.webSocketServer = new WebSocket.server( {
            httpServer: this.httpServer
        } );

        Logger.info( WebSocketService.namespace, `Listening on port ${ JSON.stringify( ( <AddressInfo>this.httpServer.address() ).port ) }.` );
        this.webSocketServer.on( 'request', this.handleRequestReceived.bind(this) );
    }

    private handleRequestReceived( request: WebSocket.request ): void {
        const connection = request.accept( null, request.origin );

        Logger.info( WebSocketService.namespace, `Client connected via ${request.origin}` );
        this.connections$.next( connection );

        connection.on( 'message', message => {
            if ( message.type === "utf8" ) {    // todo: throw error when not utf8
                const exec = JSON.parse( message.utf8Data );
                this.execs$.next( exec );
            }
        } );

        connection.on( 'close', ( reasonCode: number, description: string ) => {
            Logger.info( WebSocketService.namespace, `Connection to a client was lost because of: ${description}` );

        } );
    }

    public get allClients(): Observable<WebSocket.connection[]> {
        return this.connections$.pipe(
            filter( ( connection: WebSocket.connection ) => connection !== null ),
            scan( ( acc: WebSocket.connection[], cur: WebSocket.connection ) => [...acc, cur], [] ),
            distinctUntilChanged()
        );
    }

    public get newExec(): Observable<{ id: string, command: string, parameter?: string }> {
        return this.execs$.pipe(
            filter( ( exec: { id: string, command: string, parameter?: string } ) => exec.command !== null ),
            distinctUntilChanged()
        );
    }

    public get newClient(): Observable<WebSocket.connection> {
        return this.connections$.pipe(
            filter( ( connection: WebSocket.connection ) => connection !== null ),
            distinctUntilChanged()
        );
    }

    public broadcastEvent( event: WebSocketEvent ): void {
        this.webSocketServer.broadcastUTF( event.toString() );
    }

    public sendEvent( connection: WebSocket.connection, event: WebSocketEvent ): void {
        connection.sendUTF( event.toString() );
    }
}

export default WebSocketService;