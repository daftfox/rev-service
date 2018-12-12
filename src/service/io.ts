import {Socket, Server} from 'socket.io';
import * as SocketIO from 'socket.io';
import Debugger from 'debug';
import SocketMessage from "../domain/socket-message";

class IOService {
    port: number;
    io: Server;
    socket: Socket;
    logger: Debugger;


    initializeSocketIO(port: number) {
        this.port = port;
        this.logger = Debugger.debug('io-service');
        this.io = SocketIO.listen(this.port);

        this.io.on('connect', this.handleClientConnect.bind(this));
    }

    handleClientConnect(socket: Socket) {
        this.logger(`A new client has connected`);
        this.socket = socket;
        socket.on('disconnect', this.handleClientDisconnect.bind(this));
    }

    handleClientDisconnect() {
        this.logger(`A client has disconnected`);
    }

    broadcastUpdate(namespace: string, payload: any, sender: string) {
        this.io.emit(namespace, new SocketMessage(payload, sender, 'all'));
    }
}

export let ioService = new IOService();