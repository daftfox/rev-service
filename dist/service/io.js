"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIO = require("socket.io");
const debug_1 = require("debug");
const socket_message_1 = require("../domain/socket-message");
class IOService {
    initializeSocketIO(port) {
        this.port = port;
        this.logger = debug_1.default.debug('io-service');
        this.io = SocketIO.listen(this.port);
        this.io.on('connect', this.handleClientConnect.bind(this));
    }
    handleClientConnect(socket) {
        this.logger(`A new client has connected`);
        this.socket = socket;
        socket.on('disconnect', this.handleClientDisconnect.bind(this));
    }
    handleClientDisconnect() {
        this.logger(`A client has disconnected`);
    }
    broadcastUpdate(namespace, payload, sender) {
        this.io.emit(namespace, new socket_message_1.default(payload, sender, 'all'));
    }
}
exports.ioService = new IOService();
//# sourceMappingURL=io.js.map