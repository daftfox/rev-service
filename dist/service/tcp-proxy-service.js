"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
class TcpProxyService {
    constructor() {
        this.server = net.Server;
        this.connections = [];
        this.server = net.createServer(() => {
        });
    }
}
//# sourceMappingURL=tcp-proxy-service.js.map