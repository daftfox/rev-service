import Boards from '../model/boards';
import * as FirmataBoard from 'firmata';
import LoggerService from './logger-service';
import * as net from 'net';
import IBoard from '../domain/interface/board';
import Board from '../domain/board';
import Chalk from 'chalk';

/**
 * A service that implements method(s) to connect to devices compatible with the firmata protocol.
 *
 * @namespace ConnectionService
 */
class ConnectionService {
    /**
     * Local instance of {#link Boards}.
     *
     * @access private
     * @type {Boards}
     */
    protected model: Boards;

    /**
     * Namespace used by the local instance of {@link LoggerService}
     *
     * @access protected
     * @type {string}
     */
    protected namespace = 'ConnectionService';

    /**
     * Local instance of the {@link LoggerService} class.
     *
     * @access protected
     * @type {LoggerService}
     */
    protected log: LoggerService;

    /**
     * @constructor
     * @param {Boards} model - Data model.
     */
    constructor(model: Boards) {
        this.model = model;

        this.log = new LoggerService(this.namespace);
    }

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
        this.log.debug('Disconnect event received from board.');
        this.log.info(`Device ${Chalk.rgb(0, 143, 255).bold(board.id)} disconnected.`);

        this.model.disconnectBoard(board.id);
        reject(board);
    };

    private handleUpdateEvent = (update: IBoard) => {
        this.model.updateBoard(update);
    };

    private handleConnectionTimeout = (firmataBoard: FirmataBoard, reject: () => void) => {
        this.log.warn('Timeout while connecting to device.');

        firmataBoard.removeAllListeners();
        reject();
    };

    private handleConnectionEstablished = async (board: Board, resolve: () => void): Promise<IBoard> => {
        /*
         * The type and ID are defined by the name of the Arduino sketch file.
         * For now the following devices have a tailor made class:
         * - Major Tom ( MajorTom_<unique_identifier>.ino )
         */
        resolve();
        return this.model.addBoard(board);
    };
}

export default ConnectionService;
