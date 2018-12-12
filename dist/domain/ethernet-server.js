"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EtherPort = require("etherport");
const firmata_1 = require("firmata");
const board_server_1 = require("./board-server");
class EthernetServer extends board_server_1.default {
    constructor(port, connectedCallback, namespace) {
        super(port, connectedCallback, namespace);
        this.listen();
    }
    listen() {
        this.debugLogger(`Ground control to Major Tom.`);
        this.etherPort = new EtherPort(this.port);
        this.etherPort.on('open', this.initializeBoard.bind(this));
    }
    initializeBoard() {
        this.state = board_server_1.default.CONNECTING;
        this.debugLogger(`Can you hear me Major Tom?`);
        this.board = new firmata_1.default(this.etherPort, this.boardReadyCallback.bind(this));
    }
    // todo: fix
    handleDisconnect() {
        //this.debugLogger(`oh noes`);
        //this.emit('closed', this.port);
    }
}
exports.default = EthernetServer;
//# sourceMappingURL=ethernet-server.js.map