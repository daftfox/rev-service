import * as WebSocket from 'websocket';
import {Subscription} from "rxjs/internal/Subscription";
import {withLatestFrom} from "rxjs/operators";
import Config, {Flags} from '../config/config';
import SerialService from "../service/serial-service";
import EthernetService from "../service/ethernet-service";
import WebSocketService from "../service/web-socket-service";
import Logger from "../service/logger";
import HttpService from "../service/http-service";
import Board from "../domain/board";
import {Command} from "../interface/command";
import WebSocketEvent, {WebSocketEventType} from "../interface/web-socket-event";
import Boards from "../model/boards";

/**
 * Main controller
 * @classdesc // todo
 * @namespace MainController
 */
class MainController {
    /**
     * @type {string}
     * @static
     * @access private
     */
    private static namespace = `main`;

    /**
     * @type {Flags}
     * @access private
     */
    private options: Flags;

    /**
     * @type {Boards}
     * @access private
     */
    private model: Boards;

    /**
     * @type {WebSocketService}
     * @access private
     */
    private socketService: WebSocketService;

    /**
     * @type {EthernetService}
     * @access private
     */
    private ethernetService: EthernetService;

    /**
     * @type {SerialService}
     * @access private
     */
    private serialService: SerialService;

    /**
     * @type {HttpService}
     * @access private
     */
    private staticFileService: HttpService;

    /**
     * @type {Subscription}
     * @access private
     */
    private boardsUpdated: Subscription;

    /**
     * @type {Subscription}
     * @access private
     */
    private newClientConnected: Subscription;

    /**
     * @type {Subscription}
     * @access private
     */
    private boardDisconnected: Subscription;

    /**
     * @type {Subscription}
     * @access private
     */
    private commandReceived: Subscription;

    /**
     * Creates a new instance of MainController and starts required services
     * @constructor
     */
    constructor() {
        this.options = Config.parseOptions( process.argv );

        Logger.info( MainController.namespace, 'Starting REV' );

        process.env.verbose = this.options.verbose ? 'true' : '';
        this.startServices();
    }

    /**
     * Start services that are required to start.
     * @access private
     */
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

    /**
     * Broadcast an update with the newly connected board to connected clients.
     * @access private
     * @param {Board} board The board that was connected
     */
    private broadcastNewBoard( board: Board ): void {
        this.socketService.broadcastEvent( new WebSocketEvent( WebSocketEventType.ADD_BOARD, Board.toDiscrete( board ) ) );
    }

    /**
     * Broadcast an update with the disconnected board to connected clients.
     * @access private
     * @param {Board} board
     */
    private broadcastDisconnectedBoard( board: Board ): void {
        this.socketService.broadcastEvent( new WebSocketEvent( WebSocketEventType.REMOVE_BOARD, Board.toDiscrete( board ) ) );
    }

    /**
     * Give newly connected clients a list of all connected boards.
     * @access private
     * @param {connection} client The WebSocket connection of the client that has just connected
     * @param {Board[]} boards An array of boards that are connected
     */
    private updateAllBoardsForClient( [ client, boards ] : [ WebSocket.connection, Board[] ] ): void {
        this.socketService.sendEvent( client, new WebSocketEvent( WebSocketEventType.UPDATE_ALL_BOARDS, Board.toDiscreteArray( boards ) ) )
    }

    /**
     * Subscribe to observables exposed by services.
     * @access private
     */
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

        this.commandReceived = this.socketService.handleCommandReceived.subscribe(
            this.handleExecReceived.bind( this ),
            this.handleError
        );
    }

    /**
     * Sends a Command object received from a client to the designated board
     * @access private
     * @param {Command} command An instance of Command containing the board's id and the method to execute.
     */
    private handleExecReceived( command: Command ): void {
        this.model.executeCommand( command );
    }

    /**
     * Handle errors.
     * @access private
     * @param {Error} error
     */
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
    }
}

export default MainController;