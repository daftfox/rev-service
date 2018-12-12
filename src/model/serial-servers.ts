import SerialServer from '../domain/serial-server';
import { boards } from './boards';

class SerialServers {
    servers: SerialServer[];

    constructor() {
        this.servers = [];
    }

    initializeServers() {
        const server = new SerialServer(null, this.handleServerConnected.bind(this), 'serial-server');

        // server.on('open', (port) => this.servers[port] = server );

        // todo: handle device disconnect
        //server.on('closed', console.log);
    }

    handleServerConnected(server) {
        this.servers.push(server);
        boards.boardConnected(server.port, server.board);
        //const s = new SerialServer(null, this.handleServerConnected.bind(this), 'serial-server');
    }

    getServerByPort(port: number): SerialServer {
        return this.servers[port];
    }
}

export let serialServers = new SerialServers();