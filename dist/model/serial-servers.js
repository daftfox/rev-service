"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serial_server_1 = require("../domain/serial-server");
const boards_1 = require("./boards");
class SerialServers {
    constructor() {
        this.servers = [];
    }
    initializeServers() {
        const server = new serial_server_1.default(null, this.handleServerConnected.bind(this), 'serial-server');
        // server.on('open', (port) => this.servers[port] = server );
        // todo: handle device disconnect
        //server.on('closed', console.log);
    }
    handleServerConnected(server) {
        this.servers.push(server);
        boards_1.boards.boardConnected(server.port, server.board);
        //const s = new SerialServer(null, this.handleServerConnected.bind(this), 'serial-server');
    }
    getServerByPort(port) {
        return this.servers[port];
    }
}
exports.serialServers = new SerialServers();
//# sourceMappingURL=serial-servers.js.map