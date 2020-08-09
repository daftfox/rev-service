import { Board, FirmataBoard, IBoard } from '../domain/board';
import { LoggerService } from './logger.service';
import { singleton } from 'tsyringe';
import { Evt } from 'ts-evt';
import { BoardNotFoundError } from '../domain/error';
import { BoardDAO } from '../dao/board.dao';
import { IBoardDataValues } from '../domain/board/interface/board-data-values.interface';
import { ServerError } from '../domain/error/server.error';
import { BoardConnectedEvent, BoardDisconnectedEvent, BoardUpdatedEvent, Event } from '../domain/event';

/**
 * @description Data model for storing and sharing {@link Board}/{@link IBoard} instances across services.
 * @namespace BoardService
 */
@singleton()
export class BoardService {
    public event = new Evt<Event>();

    /**
     * Namespace used by the {@link LoggerService}
     *
     * @static
     * @access private
     * @type {string}
     */
    private namespace = 'board-service';

    /**
     * Locally stored array of {@link Board} instances that are currently online.
     * This is pre-filled with devices retrieved from the data storage.
     */
    private cache: Board[] = [];

    private static async createAndPersistNewBoard(
        dataValues: IBoardDataValues,
        firmataBoard: FirmataBoard,
    ): Promise<Board> {
        const newBoard = await BoardDAO.persist(await BoardDAO.create(dataValues));

        newBoard.attachFirmataBoard(firmataBoard);

        return newBoard;
    }

    private static initialiseBoard(board: Board, firmataBoard: FirmataBoard): Board {
        const initialisedBoard = BoardDAO.createBoardInstance(board.getDataValues());
        initialisedBoard.attachFirmataBoard(firmataBoard);

        return initialisedBoard;
    }

    public async updateCache(): Promise<void> {
        this.cache = await BoardDAO.getAll();
    }

    /**
     * Returns an array of the currently online boards.
     */
    public getAllBoards(): IBoard[] {
        return Board.toDiscreteArray(this.cache);
    }

    public getBoardById(boardId: string): Board {
        let board: Board;

        if (this.inCache(boardId) > -1) {
            board = this.cache.find(({ id }) => id === boardId);
        } else {
            throw new BoardNotFoundError(`Board with id ${boardId} could not be found.`);
        }

        return board;
    }

    private inCache(boardId: string): number {
        return this.cache.findIndex(({ id }) => id === boardId);
    }

    /**
     * Adds {@link Board} instance to the model. If the device is unknown it will be persisted to the data storage.
     */
    public async addBoard(dataValues: IBoardDataValues, firmataBoard: FirmataBoard): Promise<Board> {
        return new Promise<Board>(async (resolve, reject) => {
            let board: Board;
            let newBoard = false;

            try {
                board = this.initialiseCachedBoard(dataValues.id, firmataBoard);
            } catch (error) {
                if (error instanceof BoardNotFoundError) {
                    newBoard = true;
                    board = await BoardService.createAndPersistNewBoard(dataValues, firmataBoard);
                    this.addBoardToCache(board);
                } else {
                    LoggerService.stack(
                        new ServerError(`Board with id ${dataValues.id} could not be added due to an unknown error.`),
                    );
                    reject();
                    return;
                }
            }

            this.event.post(new BoardConnectedEvent(board.toDiscrete(), newBoard));
            resolve(board);
        });
    }

    /**
     * Disconnect a {@link Board} instance and removes it from the database.
     */
    public async deleteBoard(boardId: string): Promise<void> {
        const board = this.getBoardById(boardId);

        this.disconnectBoard(board.id);
        await BoardDAO.destroy(board);
        this.removeFromCache(board.id);
    }

    /**
     * Disconnect a {@link Board} instance and notify subscribers.
     */
    public disconnectBoard(boardId: string): void {
        const board = this.getBoardById(boardId);

        board.disconnect();
        const discreteBoard = board.toDiscrete();

        LoggerService.debug(
            `Disconnecting board with id ${LoggerService.highlight(discreteBoard.id, 'blue', true)}.`,
            this.namespace,
        );

        this.event.post(new BoardDisconnectedEvent(discreteBoard));
    }

    private removeFromCache(boardId: string): void {
        this.cache.splice(
            this.cache.findIndex(({ id }) => id === boardId),
            1,
        );
    }

    public async updateBoard(boardUpdates: IBoard): Promise<void> {
        let board = this.getBoardById(boardUpdates.id);

        board = board.online
            ? await this.updateOnlineBoard(board, boardUpdates)
            : await this.updateOfflineBoard(board, boardUpdates);

        this.updateCachedBoard(board);
    }

    private updateCachedBoard(board: Board): void {
        this.cache[this.inCache(board.id)] = board;
    }

    private addBoardToCache(board: Board): void {
        this.cache.push(board);
    }

    private async updateOfflineBoard(board: Board, boardUpdates: IBoard): Promise<Board> {
        const updatedBoard = Object.assign(board, boardUpdates);

        return this.persistChanges(updatedBoard);
    }

    /**
     * Update a {@link Board} and notify subscribers.
     */
    private async updateOnlineBoard(board: Board, boardUpdates: IBoard): Promise<Board> {
        const firmataBoard = board.getFirmataBoard();

        // re-instantiate previous board to reflect type changes
        if (board.type !== boardUpdates.type) {
            board.type = boardUpdates.type;

            board.clearAllTimers();
            board = BoardDAO.createBoardInstance(board.getDataValues());
            board.attachFirmataBoard(firmataBoard);
        }
        board.update(boardUpdates);

        return this.persistChanges(board);
    }

    private async persistChanges(board: Board): Promise<Board> {
        const persistedBoard = await BoardDAO.persist(board);
        const discreteBoard = board.toDiscrete();

        this.event.post(new BoardUpdatedEvent(discreteBoard));

        return persistedBoard;
    }

    private initialiseCachedBoard(boardId: string, firmataBoard: FirmataBoard): Board {
        const cachedBoard = this.getBoardById(boardId);

        const initialisedBoard = BoardService.initialiseBoard(cachedBoard, firmataBoard);
        this.updateCachedBoard(initialisedBoard);

        return initialisedBoard;
    }
}
