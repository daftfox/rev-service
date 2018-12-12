import EthernetServer from '../domain/ethernet-server';
import { boards } from './boards';

class EthernetServers {
    servers: EthernetServer[];
    startPort: number;
    endPort: number;

    constructor() {
        this.servers = [];
    }

    setPorts(startPort, endPort) {
        this.startPort = startPort || 3030;
        this.endPort = endPort || 3030;
    }

    initializeServers() {
        for( let port = this.startPort; port < this.endPort; port++ ) {
            this.startServer(port);
        }
    }

    startServer(port) {
        this.servers[port] = new EthernetServer(port, this.handleDeviceConnect, 'ethernet-server');
        // todo: handle device disconnect
    }

    handleDeviceConnect(server) {
        boards.boardConnected(server.port, server.board);
    }
}

export let ethernetServers = new EthernetServers();