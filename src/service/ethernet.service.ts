import { ConnectionService } from './connection.service';
import { LoggerService } from './logger.service';
import { Server, Socket } from 'net';
import { Board } from '../domain/board';
import {container, singleton} from 'tsyringe';
import {ConfigurationService} from "./configuration.service";

/**
 * @classdesc An ethernet service that opens a socket and attempts to connect to boards that knock on the proverbial door.
 * @namespace EthernetService
 */

@singleton()
export class EthernetService extends ConnectionService {
    /**
     * @access private
     * @type {net.Server}
     */
    private server: Server;

    protected namespace = 'ethernet-service';

    /**
     * @constructor
     */
    constructor() {
        super();
        this.server = new Server(this.handleConnectionRequest);
    }

    public listen(): void {
        const port = container.resolve(ConfigurationService).ethernetPort;

        LoggerService.info(`Listening on port ${LoggerService.highlight(port.toString(10), 'yellow', true)}.`, this.namespace);

        this.server.listen(port);
    }

    public closeServer(): void {
        this.server.close();
    }

    protected handleConnected = (board: Board): void => {
        LoggerService.info(`Device ${LoggerService.highlight(board.id, 'blue', true)} connected.`, this.namespace);
    };

    protected handleDisconnected(socket: Socket, board?: Board): void {
        socket.end();
        socket.destroy();
    }

    private handleConnectionRequest = (socket: Socket): Promise<void> => {
        LoggerService.debug(`New connection attempt.`, this.namespace);

        return this.connectToBoard(socket)
            .then(this.handleConnected)
            .catch((board: Board) => {
                this.handleDisconnected(socket, board);
            });
    };
}
