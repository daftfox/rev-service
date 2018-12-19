"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config/config");
const boards_1 = require("../model/boards");
const serial_service_1 = require("../service/serial-service");
const ethernet_service_1 = require("../service/ethernet-service");
const web_socket_service_1 = require("../service/web-socket-service");
const board_1 = require("../domain/board");
const debug_1 = require("debug");
const web_socket_event_1 = require("../interface/web-socket-event");
const operators_1 = require("rxjs/operators");
class MainController {
    constructor() {
        this.debug = debug_1.default.debug('firmata-radar');
        this.flags = config_1.default.parseFlags(process.argv);
        this.socketService = new web_socket_service_1.default(this.flags.port);
        this.model = new boards_1.default();
        this.startServices();
    }
    startServices() {
        if (this.flags.ethernet) {
            this.ethernetService = new ethernet_service_1.default(this.model, this.flags.startPort, this.flags.endPort);
        }
        if (this.flags.serial) {
            this.serialService = new serial_service_1.default(this.model);
        }
        this.subscribeToEvents();
    }
    broadcastNewBoard(board) {
        this.socketService.broadcastEvent(new web_socket_event_1.default(web_socket_event_1.WebSocketEventType.ADD_BOARD, board_1.default.minify(board)));
    }
    broadcastDisconnectedBoard(board) {
        this.socketService.broadcastEvent(new web_socket_event_1.default(web_socket_event_1.WebSocketEventType.REMOVE_BOARD, board_1.default.minify(board)));
    }
    updateAllBoardsForClient([client, boards]) {
        this.socketService.sendEvent(client, new web_socket_event_1.default(web_socket_event_1.WebSocketEventType.UPDATE_ALL_BOARDS, board_1.default.minifyArray(boards)));
    }
    subscribeToEvents() {
        this.boardsUpdated = this.model.boards.subscribe(this.broadcastNewBoard.bind(this), this.debug);
        this.newClientConnected = this.socketService.newClient.pipe(operators_1.withLatestFrom(this.model.getAllBoards)).subscribe(this.updateAllBoardsForClient.bind(this), this.debug);
        this.boardDisconnected = this.model.boardDisconnected.subscribe(this.broadcastDisconnectedBoard.bind(this), this.debug);
    }
}
exports.default = MainController;
//# sourceMappingURL=main.js.map