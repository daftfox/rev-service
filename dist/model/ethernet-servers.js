"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethernet_server_1 = require("../domain/ethernet-server");
const boards_1 = require("./boards");
class EthernetServers {
    constructor() {
        this.servers = [];
    }
    setPorts(startPort, endPort) {
        this.startPort = startPort || 3030;
        this.endPort = endPort || 3030;
    }
    initializeServers() {
        for (let port = this.startPort; port < this.endPort; port++) {
            this.startServer(port);
        }
    }
    startServer(port) {
        this.servers[port] = new ethernet_server_1.default(port, this.handleDeviceConnect, 'ethernet-server');
        // todo: handle device disconnect
    }
    handleDeviceConnect(server) {
        boards_1.boards.boardConnected(server.port, server.board);
    }
}
exports.ethernetServers = new EthernetServers();
//# sourceMappingURL=ethernet-servers.js.map