import Config, {Flags} from '../config/config';
import Boards from "../model/boards";
import SerialService from "../service/serial-service";
import EthernetService from "../service/ethernet-service";
import WebSocketService from "../service/web-socket-service";
import Board from "../domain/board";
import Debugger from "debug";
import WebSocketEvent, {WebSocketEventType} from "../interface/web-socket-event";
import * as WebSocket from 'websocket';
import {Subscription} from "rxjs/internal/Subscription";
import {withLatestFrom} from "rxjs/operators";

class MainController {
    private readonly flags:         Flags;
    private readonly model:         Boards;
    private readonly socketService: WebSocketService;
    private readonly debug = Debugger.debug('rev');

    private ethernetService:        EthernetService;
    private serialService:          SerialService;
    private boardsUpdated:          Subscription;
    private newClientConnected:     Subscription;
    private boardDisconnected:      Subscription;

    constructor () {
        this.flags         = Config.parseFlags(process.argv);
        this.socketService = new WebSocketService(this.flags.port);
        this.model         = new Boards();
        this.startServices();
    }

    private startServices(): void {
        if (this.flags.ethernet) {
            this.ethernetService = new EthernetService(this.model, this.flags.startPort, this.flags.endPort);
        }

        if (this.flags.serial) {
            this.serialService   = new SerialService(this.model);
        }

        this.subscribeToEvents();
    }

    private broadcastNewBoard( board: Board ): void {
        this.socketService.broadcastEvent( new WebSocketEvent( WebSocketEventType.ADD_BOARD, Board.minify( board ) ) );
    }

    private broadcastDisconnectedBoard( board: Board ): void {
        this.socketService.broadcastEvent( new WebSocketEvent( WebSocketEventType.REMOVE_BOARD, Board.minify( board ) ) );
    }

    private updateAllBoardsForClient( [ client, boards ] : [ WebSocket.connection, Board[] ] ): void {
        this.socketService.sendEvent( client, new WebSocketEvent( WebSocketEventType.UPDATE_ALL_BOARDS, Board.minifyArray( boards ) ) )
    }

    private subscribeToEvents(): void {
        this.boardsUpdated = this.model.boards.subscribe(
            this.broadcastNewBoard.bind(this),
            this.debug
        );

        this.newClientConnected = this.socketService.newClient.pipe(
            withLatestFrom( this.model.getAllBoards )
        ).subscribe(
            this.updateAllBoardsForClient.bind(this),
            this.debug
        );

        this.boardDisconnected = this.model.boardDisconnected.subscribe(
            this.broadcastDisconnectedBoard.bind(this),
            this.debug
        );
    }
}

export default MainController;