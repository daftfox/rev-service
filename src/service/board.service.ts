import {
    Board,
    IDLE,
    IBoard,
    AVAILABLE_EXTENSIONS_CLASSES,
    isAvailableExtension,
    AVAILABLE_EXTENSIONS_KEYS,
} from '../domain/board';
import { LoggerService } from './logger.service';
import { Program, ICommand } from '../domain/program';
import {singleton} from 'tsyringe';
import * as events from 'events';
import {
    BoardIncompatibleError,
    BoardNotFoundError,
    BoardTypeNotFoundError,
    BoardUnavailableError,
} from '../domain/error';

/**
 * @description Data model for storing and sharing {@link Board}/{@link IBoard} instances across services.
 * @namespace BoardService
 */
@singleton()
export class BoardService extends events.EventEmitter {
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
    private _boards: Board[] = [];

    constructor() {
        super();
    }

    /**
     * Create an instance of a {@link Board} reflecting its type.
     * Currently supported types are {@link Board} (default) and {@link MajorTom}, as dictated by {@link BoardService.AVAILABLE_TYPES}.
     */
    public static instantiateNewBoard(board: Board): Board {
        const dataValues = {
            id: board.id,
            name: board.name,
            type: board.type,
            lastUpdateReceived: board.lastUpdateReceived,
        };

        if (isAvailableExtension(board.type)) {
            return new AVAILABLE_EXTENSIONS_CLASSES[board.type](
                dataValues,
                { isNewRecord: board.isNewRecord },
                board.getFirmataBoard(),
            );
        } else {
            throw new BoardTypeNotFoundError(
                `Type '${board.type}' is not a valid type. Valid types are${Object.values(
                    AVAILABLE_EXTENSIONS_KEYS,
                ).map(availableExtension => ` '${availableExtension}'`)}`,
            );
        }
    }

    /**
     * Find or instantiate a {@link Board} instance.
     */
    private static async findOrBuildBoard(id: string, type: string): Promise<Board> {
        let [board] = await Board.findOrBuild({
            where: {
                id,
            },
            defaults: {
                id,
                type,
            },
        });

        board = BoardService.instantiateNewBoard(board);

        return Promise.resolve(board);
    }

    public synchronise(): Promise<void> {
        return Board.findAll().then(boards => {
            this._boards = boards.map(board => BoardService.instantiateNewBoard(board));
        });
    }

    /**
     * Returns an array of the currently online boards.
     */
    public getAllBoards(): IBoard[] {
        return Board.toDiscreteArray(this._boards);
    }

    /**
     * Returns the {@link Board} instance with the boardId supplied in the argument.
     */
    public getDiscreteBoardById(boardId: string): IBoard {
        const board = this.getBoardById(boardId);

        return Board.toDiscrete(board);
    }

    public getBoardById(boardId): Board {
        const board = this._boards.find(({ id }) => id === boardId);

        if (!board) {
            throw new BoardNotFoundError(`Board with id ${boardId} could not be found.`);
        }

        return board;
    }

    /**
     * Adds {@link Board} instance to the model. If the device is unknown it will be persisted to the data storage.
     */
    public async addBoard(board: Board): Promise<IBoard> {
        return new Promise<IBoard>(async (resolve, reject) => {
            let newBoard = false;

            if (this.boardExists(board.id)) {
                await this.updateBoard(Board.toDiscrete(board));
            } else {
                newBoard = true;
                board = await this.createAndPersistBoard(board);
            }

            // retrieve a lean copy of the Board instance
            const discreteBoard = Board.toDiscrete(board);

            this.emit('connected', discreteBoard, newBoard);
            resolve(discreteBoard);
        });
    }

    /**
     * Disconnect a {@link Board} instance and removes it from the database.
     */
    public deleteBoard(boardId: string): void {
        const board = this.getBoardById(boardId);
        LoggerService.debug(
            `Deleting board with id ${LoggerService.highlight(board.id, 'blue', true)} from the database.`,
            this.namespace
        );
        this.disconnectBoard(board.id);
        board.destroy();
        this._boards.splice(this._boards.findIndex(({ id }) => id === board.id), 1);
    }

    /**
     * Disconnect a {@link Board} instance and notify subscribers.
     */
    public disconnectBoard(boardId: string): void {
        const board = this.getBoardById(boardId);
        const discreteBoard = Board.toDiscrete(board);

        LoggerService.debug(
            `Setting board with id ${LoggerService.highlight(boardId, 'blue', true)}'s status to disconnected.`,
            this.namespace
        );
        board.disconnect();
        board.save();

        this.emit('disconnected', discreteBoard);
    }

    /**
     * Update a {@link Board} and notify subscribers.
     */
    public async updateBoard(boardUpdates: IBoard): Promise<void> {
        let board = this.getBoardById(boardUpdates.id);

        // do not allow the user to change the Board.type property into an unsupported value
        if (boardUpdates.type && !isAvailableExtension(boardUpdates.type)) {
            throw new BoardTypeNotFoundError(
                `Type '${boardUpdates.type}' is not a valid type. Valid types are${Object.values(
                    AVAILABLE_EXTENSIONS_KEYS,
                ).map(availableExtension => ` '${availableExtension}'`)}.`,
            );
        }

        // re-instantiate previous board to reflect type changes
        if (board.type !== boardUpdates.type) {
            board.type = boardUpdates.type;

            // clear non-essential timers and listeners
            if (board.online) {
                board.clearAllTimers();
            }

            // create new instance if board is online and attach the existing online FirmataBoard instance to it
            board = BoardService.instantiateNewBoard(board);
        }

        // update existing board values and persist changes to the data storage
        LoggerService.debug(
            `Storing update for board with id ${LoggerService.highlight(board.id, 'blue', true)} in the database.`,
            this.namespace
        );
        await board.update(boardUpdates);

        const discreteBoard = Board.toDiscrete(board);

        this.emit('update', discreteBoard);
        return Promise.resolve();
    }

    /**
     * Execute an action on {@link Board} belonging to the supplied ID.
     */
    public executeActionOnBoard(id: string, command: ICommand): Promise<void> {
        const board = this.getBoardById(id);
        let timeout;

        return new Promise((resolve, reject) => {
            try {
                board.executeAction(command.action, command.parameters);
                timeout = setTimeout(resolve, command.duration || 100);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Stop a {@link Board} instance from running its current {@link Program}.
     */
    public stopProgram(id: string): void {
        const board = this.getBoardById(id);
        board.currentProgram = IDLE;
    }

    /**
     * Executes the program on the supplied board.
     */
    public async executeProgramOnBoard(id: string, program: Program, repeat: number = 1): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const board = this.getBoardById(id);

            // do not allow the user to execute a program on the board if it is already busy executing one
            if (board.currentProgram !== IDLE) {
                reject(
                    new BoardUnavailableError(
                        `Board with id ${board.id} is already running a program (${board.currentProgram}). Stop the currently running program or wait for it to finish.`,
                    ),
                );
                return;
            }

            // do not allow the user to execute a program on the board if the program doesn't support the board
            if (program.deviceType !== board.type && program.deviceType !== 'all') {
                reject(
                    new BoardIncompatibleError(
                        `The program ${program.name} cannot be run on board with id ${board.id}, because it is of the wrong type. Program ${program.name} can only be run on devices of type ${program.deviceType}.`,
                    ),
                );
                return;
            }

            // set the board's current program status
            board.currentProgram = program.name;
            const discreteBoard = Board.toDiscrete(board);

            try {
                if (repeat === -1) {
                    // execute program indefinitely
                    while (board.currentProgram === program.name) {
                        await this.runProgram(discreteBoard, program);
                    }
                } else {
                    // execute program n times
                    for (let repetition = 0; repetition < repeat; repetition++) {
                        await this.runProgram(discreteBoard, program);
                    }
                }
            } catch (error) {
                reject(error);
            }

            // set the board's current program status to 'idle'
            this.stopProgram(board.id);
            resolve();
        });
    }

    /**
     * Run a {@link Program} on a {@link Board}.
     */
    private async runProgram(board: IBoard, program: Program): Promise<void> {
        return new Promise(async (resolve, reject) => {
            for (const command of program.commands) {
                // stop executing the program as soon as the board's program status changes
                if (board.currentProgram !== program.name) {
                    break;
                }

                try {
                    await this.executeActionOnBoard(board.id, command);
                } catch (error) {
                    reject(error);
                    return;
                }
            }

            resolve();
            return;
        });
    }

    private async createAndPersistBoard(board: Board): Promise<Board> {
        return new Promise(async (resolve, reject) => {
            LoggerService.debug(
                `Storing new board with id ${LoggerService.highlight(board.id, 'blue', true)} in the database.`,
                this.namespace
            );
            if (board.type !== board.constructor.name) {
                board = BoardService.instantiateNewBoard(board);
            }

            try {
                await board.save();
                this._boards.push(board);
                resolve(board);
            } catch (error) {
                reject(error);
            }

            return;
        });
    }

    private boardExists(boardId: string): boolean {
        return this._boards.filter(({ id }) => id === boardId).length > 0;
    }
}
