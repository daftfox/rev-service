import ConnectionService from './connection-service';
import Boards from '../model/boards';
import LoggerService from './logger-service';
import { Server, Socket } from 'net';
import Chalk from 'chalk';
import Board from '../domain/board';
import IBoard from '../domain/interface/board';

/**
 * @classdesc An ethernet service that opens a socket and attempts to connect to boards that knock on the proverbial door.
 * @namespace EthernetService
 */
class EthernetService extends ConnectionService {
    /**
     * @access private
     * @type {net.Server}
     */
    private server: Server;

    private port: number;

    /**
     * @constructor
     * @param {Boards} model Data model.
     * @param {number} port
     */
    constructor(model: Boards, port: number) {
        super(model);

        this.namespace = 'ethernet';
        this.port = port;
        this.log = new LoggerService(this.namespace);

        this.server = new Server(this.handleConnectionRequest);
    }

    /**
     * Start listening on the port supplied for the ethernet service.
     * @param {number} port
     */
    public listen(): void {
        this.log.info(`Listening on port ${Chalk.rgb(240, 240, 30).bold(this.port.toString(10))}.`);

        this.server.listen(this.port);
    }

    /**
     * Handle new connection requests and connect to the board.
     *
     * @param {net.Socket} socket
     * @returns {void}
     */
    private handleConnectionRequest = (socket: Socket): void => {
        this.log.debug(`New connection attempt.`);

        this.connectToBoard(socket, false, this.handleConnected, (board: IBoard) => {
            this.handleDisconnected(socket, board);
        });
    };

    public closeServer(): void {
        this.server.close();
    }

    private handleConnected = (board: IBoard) => {
        this.log.info(`Device ${Chalk.rgb(0, 143, 255).bold(board.id)} connected.`);
    };

    /**
     * Handles a connected board.
     *
     * @param {net.Socket} socket
     * @param {Board} board
     * @returns {void}
     */
    private handleDisconnected(socket: Socket, board?: IBoard): void {
        socket.end();
        socket.destroy();

        if (board) {
            this.log.info(`Device ${Chalk.rgb(0, 143, 255).bold(board.id)} disconnected.`);

            this.model.disconnectBoard(board.id);
        }
    }
}

export default EthernetService;
