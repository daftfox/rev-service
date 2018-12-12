"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethernet_servers_1 = require("../model/ethernet-servers");
const serial_servers_1 = require("../model/serial-servers");
const config_1 = require("../config/config");
const io_1 = require("../service/io");
const boards_1 = require("../model/boards");
class MainController {
    constructor() {
        this.options = config_1.default.options.parse(process.argv);
        this.startWebSocket();
        this.listenForBoardChanges();
        this.startServers();
    }
    startServers() {
        if (this.options.ethernet) {
            this.startEthernetServers();
        }
        if (this.options.serial) {
            this.startSerialServers();
        }
    }
    startWebSocket() {
        io_1.ioService.initializeSocketIO(this.options.port);
    }
    startEthernetServers() {
        ethernet_servers_1.ethernetServers.setPorts(this.options.startPort, this.options.endPort);
        ethernet_servers_1.ethernetServers.initializeServers();
    }
    startSerialServers() {
        serial_servers_1.serialServers.initializeServers();
    }
    listenForBoardChanges() {
        boards_1.boards.on('board-connected', this.handleBoardConnected);
        boards_1.boards.on('board-disconnected', this.handleBoardDisconnected);
    }
    handleBoardConnected(port) {
        io_1.ioService.broadcastUpdate('board-connected', { id: port }, 'ground-control');
    }
    handleBoardDisconnected() {
    }
}
exports.default = MainController;
//# sourceMappingURL=main.js.map