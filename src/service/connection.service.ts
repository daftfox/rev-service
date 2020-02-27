import { BoardService } from './board.service';
import { LoggerService } from './logger.service';
import {Socket} from 'net';
import {Board, FirmataBoard, IBoard} from '../domain/board';
import { container, injectable } from 'tsyringe';
import {IBoardDataValues} from "../domain/board/interface/board-data-values.interface";

export const CONNECTION_TIMEOUT = 10000;

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

    /**
     * Sets up a connection to a board.
     *
     * @param {net.Socket} port - An EtherPort object or serial port address
     */
    protected async connectToBoard(port: Socket | string): Promise<Board> {
        return new Promise<Board>(async (resolve, reject) => {
            const firmataBoard = new FirmataBoard(port);
            let dataValues: IBoardDataValues = {
                id: undefined,
                type: undefined
            };

            firmataBoard.error.attach((error: Error) => {
                LoggerService.debug(error.message);
                reject(dataValues.id);
            });

            firmataBoard.update.attach(this.handleUpdateEvent);

            firmataBoard.disconnect.attachOnce(() => {
                this.handleDisconnectEvent(dataValues.id, reject);
            });

            /*
             * Wait ten seconds for a successful connection.
             * The device is deemed unsupported if a connection could not be made within that period.
             */
            try {
                const dataValues = await firmataBoard.firmwareUpdated.waitFor(CONNECTION_TIMEOUT);
                await firmataBoard.ready.waitFor(CONNECTION_TIMEOUT);
                resolve(await this.handleConnectionEstablished(dataValues, firmataBoard));
            } catch (error) {
                this.handleConnectionTimeout(firmataBoard);
                reject();
            }
        });
    }

    private handleDisconnectEvent = (boardId: string, reject: (boardId: string) => void) => {
        LoggerService.debug('Disconnect event received from board.', this.namespace);
        LoggerService.info(`Device ${LoggerService.highlight(boardId, 'blue', true)} disconnected.`, this.namespace);

        this.model.disconnectBoard(boardId);
        reject(boardId);
    };

    private handleUpdateEvent = (update: IBoard): void => {
        this.model.updateBoard(update);
    };

    private handleConnectionTimeout = (firmataBoard: FirmataBoard) => {
        LoggerService.warn('Timeout while connecting to device.', this.namespace);

        firmataBoard.removeAllListeners();
    };

    private handleConnectionEstablished = async (dataValues: IBoardDataValues, firmataBoard: FirmataBoard): Promise<Board> => {
        return this.model.addBoard(dataValues, firmataBoard);
    };
}
