import { BoardService } from './board.service';
import * as FirmataBoard from 'firmata';
import { LoggerService } from './logger.service';
import * as net from 'net';
import { Board, IBoard } from '../domain/board';
import { container, injectable } from 'tsyringe';

/**
 * A service that implements method(s) to connect to devices compatible with the firmata protocol.
 *
 * @namespace ConnectionService
 */
@injectable()
export class ConnectionService {
    /**
     * Local instance of {#link BoardService}.
     *
     * @access private
     * @type {BoardService}
     */
    protected model: BoardService;

    /**
     * Namespace used by the {@link LoggerService}
     *
     * @access protected
     * @type {string}
     */
    protected namespace = 'connection-service';

    /**
     * @constructor
     * @param {BoardService} model - Data model.
     */
    constructor() {
        this.model = container.resolve(BoardService);
    }

    // public abstract listen(): void;
    // public abstract closeServer(): void;
    // protected abstract handleConnected(board: Board): void;
    // protected abstract handleDisconnected(port: SerialPort.PortInfo | Socket, board?: Board): void;

    /**
     * Sets up a connection to a board.
     *
     * @param {net.Socket} port - An EtherPort object or serial port address
     */
    protected async connectToBoard(port: net.Socket | string): Promise<IBoard> {
        return new Promise<IBoard>((resolve, reject) => {
            const firmataBoard = new FirmataBoard(port);
            const board = new Board(undefined, undefined, firmataBoard);

            /*
             * Set a 10 second timeout.
             * The device is deemed unsupported if a connection could not be made within that period.
             */
            const connectionTimeout = setTimeout(() => {
                this.handleConnectionTimeout(firmataBoard, reject);
            }, 10000);

            firmataBoard.on('ready', async () => {
                clearTimeout(connectionTimeout);
                await this.handleConnectionEstablished(board, resolve);
            });

            firmataBoard.on('error', e => {
                reject(board);
            });

            firmataBoard.on('update', this.handleUpdateEvent);

            firmataBoard.once('disconnect', () => {
                this.handleDisconnectEvent(board, reject);
            });
        });
    }

    private handleDisconnectEvent = (board: Board, reject: (board: Board) => void) => {
        LoggerService.debug('Disconnect event received from board.', this.namespace);
        LoggerService.info(`Device ${LoggerService.highlight(board.id, 'blue', true)} disconnected.`, this.namespace);

        this.model.disconnectBoard(board.id);
        reject(board);
    };

    private handleUpdateEvent = (update: IBoard) => {
        this.model.updateBoard(update);
    };

    private handleConnectionTimeout = (firmataBoard: FirmataBoard, reject: () => void) => {
        LoggerService.warn('Timeout while connecting to device.', this.namespace);

        firmataBoard.removeAllListeners();
        reject();
    };

    private handleConnectionEstablished = async (board: Board, resolve: () => void): Promise<IBoard> => {
        resolve();
        return this.model.addBoard(board);
    };
}
