import Config, {Flags} from '../config/config';
import Boards from "../model/boards";
import SerialService from "../service/serial-service";
import EthernetService from "../service/ethernet-service";
import WebSocketService from "../service/web-socket-service";
import Board from "../domain/board";
import WebSocketEvent, {WebSocketEventType} from "../interface/web-socket-event";
import * as WebSocket from 'websocket';
import {Subscription} from "rxjs/internal/Subscription";
import {withLatestFrom} from "rxjs/operators";
import Logger from "../service/logger";
import HttpService from "../service/http-service";
import {Command} from "../interface/command";

class MainController {
    private static namespace = `main`;

    private options:                Flags;
    private model:                  Boards;
    private socketService:          WebSocketService;
    private ethernetService:        EthernetService;
    private serialService:          SerialService;
    private staticFileService:      HttpService;
    private boardsUpdated:          Subscription;
    private newClientConnected:     Subscription;
    private boardDisconnected:      Subscription;
    private execReceived:           Subscription;

    constructor () {
        this.options = Config.parseOptions( process.argv );

        Logger.info( MainController.namespace, 'Starting REV' );

        process.env.verbose = this.options.verbose ? 'true' : '';

        this.startServices();
    }

    private startServices(): void {
        this.staticFileService = new HttpService( this.options.port );
        this.socketService     = new WebSocketService( this.staticFileService.getServer() );
        this.model             = new Boards();

        if ( this.options.ethernet ) {
            this.ethernetService = new EthernetService( this.model, this.options.startPort, this.options.endPort );
        }

        if ( this.options.serial ) {
            this.serialService   = new SerialService( this.model );
        }

        this.subscribeToEvents();

        process.on('uncaughtException', this.handleError );
    }

    private broadcastNewBoard( board: Board ): void {
        this.socketService.broadcastEvent( new WebSocketEvent( WebSocketEventType.ADD_BOARD, Board.toDiscrete( board ) ) );
    }

    private broadcastDisconnectedBoard( board: Board ): void {
        this.socketService.broadcastEvent( new WebSocketEvent( WebSocketEventType.REMOVE_BOARD, Board.toDiscrete( board ) ) );
    }

    private updateAllBoardsForClient( [ client, boards ] : [ WebSocket.connection, Board[] ] ): void {
        this.socketService.sendEvent( client, new WebSocketEvent( WebSocketEventType.UPDATE_ALL_BOARDS, Board.toDiscreteArray( boards ) ) )
    }

    private subscribeToEvents(): void {
        this.boardsUpdated = this.model.boards.subscribe(
            this.broadcastNewBoard.bind( this ),
            this.handleError
        );

        this.newClientConnected = this.socketService.newClient.pipe(
            withLatestFrom( this.model.getAllBoards )
        ).subscribe(
            this.updateAllBoardsForClient.bind( this ),
            this.handleError
        );

        this.boardDisconnected = this.model.boardDisconnected.subscribe(
            this.broadcastDisconnectedBoard.bind( this ),
            this.handleError
        );

        this.execReceived = this.socketService.newExec.subscribe(
            this.handleExecReceived.bind( this ),
            this.handleError
        )
    }

    private handleExecReceived( command: Command ): void {
        this.model.executeOnBoard( command );
    }

    private handleError ( error: Error ): void {
        switch( error.constructor.name ) {
            case 'CommandError':
            case 'NotFoundError':
                Logger.warn( MainController.namespace, error.message );
                break;
            case 'Error':
                Logger.stack( MainController.namespace, error );
                break;
            case 'BoardError':
            default:
                Logger.error( MainController.namespace, error );
        }
        // Logger.error( MainController.namespace, error );
    }
}

export default MainController;