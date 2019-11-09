import Boards from '../model/boards';
import * as FirmataBoard from 'firmata';
import LoggerService from './logger-service';
import * as net from 'net';
import IBoard from '../domain/interface/board';

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

    // todo: refactor this and place it in Boards model
    private static getBoardType(firmataBoard: FirmataBoard): string {
        // todo: return default board type if no type could be distinguished
        return firmataBoard.firmware.name.split('_').shift();
    }

    // todo: refactor this and place it in Boards model
    private static getBoardId(firmataBoard: FirmataBoard): string {
        // todo: handle exception flows
        return firmataBoard.firmware.name
            .split('_')
            .pop()
            .replace('.ino', '');
    }

    /**
     * Sets up a connection to a board.
     *
     * @param {net.Socket} port - An EtherPort object or serial port address
     * @param {function(IBoard):void} [connected] - Callback for when device successfully connects, containing an object implementing the {@link IBoard} interface.
     * @param {function(IBoard):void} [disconnected] - Callback when device disconnects containing an object implementing the {@link IBoard} interface.
     */
    protected connectToBoard(
        port: net.Socket | string,
        isSerialConnection: boolean,
        connected?: (board: IBoard) => void,
        disconnected?: (board?: IBoard) => void,
    ): void {
        let board: IBoard;
        const firmataBoard = new FirmataBoard(port);

        /*
         * Set a 10 second timeout.
         * The device is deemed unsupported if a connection could not be made within that period.
         */
        const connectionTimeout = setTimeout(() => {
            this.connectionTimeout(firmataBoard, disconnected);
        }, 10000);

        firmataBoard.on('ready', async () => {
            clearTimeout(connectionTimeout);
            board = await this.connectionEstablished(firmataBoard, isSerialConnection, connected);
        });

        firmataBoard.on('error', err => {
            disconnected(board);
        });

        firmataBoard.on('update', this.handleUpdateEvent);

        firmataBoard.once('disconnect', () => {
            disconnected(board);
            this.handleDisconnectEvent(firmataBoard);
        });
    }

    private handleDisconnectEvent = (firmataBoard: FirmataBoard) => {
        this.log.debug('Disconnect event received from firmataboard.');

        if (firmataBoard && 'name' in firmataBoard.firmware) {
            this.model.disconnectBoard(ConnectionService.getBoardId(firmataBoard));
        }
    };

    private handleUpdateEvent = (update: IBoard) => {
        this.model.updateBoard(update);
    };

    private connectionTimeout = (firmataBoard: FirmataBoard, callback: () => void) => {
        this.log.warn('Timeout while connecting to device.');

        firmataBoard.removeAllListeners();

        callback();
    };

    private connectionEstablished = async (
        firmataBoard: FirmataBoard,
        serialConnection: boolean,
        callback: (board: IBoard) => void,
    ) => {
        /*
         * The type and ID are defined by the name of the Arduino sketch file.
         * For now the following devices have a tailor made class:
         * - Major Tom ( MajorTom_<unique_identifier>.ino )
         */
        // add connected device to list of available devices and / or persist to the data storage if new
        const board = await this.model.addBoard(
            ConnectionService.getBoardId(firmataBoard),
            ConnectionService.getBoardType(firmataBoard),
            serialConnection,
            firmataBoard,
        );

        // callback to connection interface service
        callback(board);

        return board;
    };
}

export default ConnectionService;
