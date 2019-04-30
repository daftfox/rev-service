"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const board_service_1 = require("./board-service");
const logger_1 = require("./logger");
const net_1 = require("net");
const chalk_1 = require("chalk");
/**
 * @classdesc An ethernet service that opens a socket and attempts to connect to boards that knock on the proverbial door.
 * @namespace EthernetService
 */
class EthernetService extends board_service_1.default {
    /**
     * @constructor
     * @param {Boards} model Data model that implements an addBoard and removeBoard method.
     * @param {number} port
     */
    constructor(model, port) {
        super(model);
        this.namespace = 'ethernet';
        this.log = new logger_1.default(this.namespace);
        this.listen(port);
    }
    /**
     * Start listening on the port supplied for the ethernet service.
     * @param {number} port
     */
    listen(port) {
        this.log.info(`Listening on port ${chalk_1.default.rgb(240, 240, 30).bold(port.toString(10))}.`);
        this.server = new net_1.Server(this.handleConnectionRequest.bind(this)).listen(port);
        this.server.on('error', console.log);
    }
    /**
     * Handle new connection requests and connect to the board.
     *
     * @param {net.Socket} socket
     * @returns {void}
     */
    handleConnectionRequest(socket) {
        let board;
        this.log.debug(`New connection attempt.`);
        this.connectToBoard(socket, (_board) => {
            board = _board;
            this.log.info(`Device ${chalk_1.default.rgb(0, 143, 255).bold(board.id)} connected.`);
        }, (_board) => {
            board = null;
            this.handleDisconnected(socket, _board);
        });
    }
    /**
     * Handles a disconnected board.
     *
     * @param {net.Socket} socket
     * @param {Board} board
     * @returns {void}
     */
    handleDisconnected(socket, board) {
        socket.end();
        socket.destroy();
        if (board) {
            this.log.info(`Device ${board.id} disconnected.`);
            this.model.removeBoard(board.id);
        }
    }
}
exports.default = EthernetService;
//# sourceMappingURL=ethernet-service.js.map