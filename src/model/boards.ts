import Board, { IDLE } from '../domain/board';
import LoggerService from '../service/logger-service';
import Chalk from 'chalk';
import IBoard from '../domain/interface/board';
import NotFound from '../domain/web-socket-message/error/not-found';
import BadRequest from '../domain/web-socket-message/error/bad-request';
import MajorTom from '../domain/major-tom';
import ICommand from '../domain/interface/command';
import Program from '../domain/program';
import Conflict from '../domain/web-socket-message/error/conflict';
import MethodNotAllowed from '../domain/web-socket-message/error/method-not-allowed';
import LedController from '../domain/led-controller';
import AvailableTypes from '../domain/available-types';
import * as events from 'events';

/**
 * @description Data model for storing and sharing {@link Board}/{@link IBoard} instances across services.
 * @namespace Boards
 */
class Boards extends events.EventEmitter {
    /**
     * Namespace used by the local instance of {@link LoggerService}
     *
     * @static
     * @access private
     * @type {string}
     */
    private static namespace = 'board-model';

    /**
     * Local instance of the {@link LoggerService} class.
     *
     * @static
     * @access private
     * @type {LoggerService}
     */
    private static log = new LoggerService(Boards.namespace);

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
     * Currently supported types are {@link Board} (default) and {@link MajorTom}, as dictated by {@link Boards.AVAILABLE_TYPES}.
     */
    public static instantiateNewBoard(board: Board): Board {
        let newBoardInstance: Board;

        const dataValues = {
            id: board.id,
            name: board.name,
            type: board.type,
            lastUpdateReceived: board.lastUpdateReceived,
        };

        switch (board.type) {
            case 'MajorTom':
                newBoardInstance = new MajorTom(
                    dataValues,
                    { isNewRecord: board.isNewRecord },
                    board.getFirmataBoard(),
                );
                break;
            case 'LedController':
                newBoardInstance = new LedController(
                    dataValues,
                    { isNewRecord: board.isNewRecord },
                    board.getFirmataBoard(),
                );
                break;
            default:
                newBoardInstance = new Board(dataValues, { isNewRecord: board.isNewRecord }, board.getFirmataBoard());
                break;
        }

        return newBoardInstance;
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

        board = Boards.instantiateNewBoard(board);

        return Promise.resolve(board);
    }

    public synchronise(): Promise<void> {
        return Board.findAll().then(boards => {
            this._boards = boards.map(board => Boards.instantiateNewBoard(board));
        });
    }

    /**
     * Returns an array of the currently online boards.
     */
    public get boards(): IBoard[] {
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
            throw new NotFound(`Board with id ${boardId} could not be found.`);
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
        Boards.log.debug(`Deleting board with id ${Chalk.rgb(0, 143, 255).bold(boardId)} from the database.`);
        this.disconnectBoard(boardId);
        this.getBoardById(boardId).destroy();
        this._boards.splice(this._boards.findIndex(({ id }) => id === boardId), 1);
    }

    /**
     * Disconnect a {@link Board} instance and notify subscribers.
     */
    public disconnectBoard(boardId: string): void {
        const board = this.getBoardById(boardId);
        const discreteBoard = Board.toDiscrete(board);

        Boards.log.debug(`Setting board with id ${Chalk.rgb(0, 143, 255).bold(boardId)}'s status to disconnected.`);
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
        if (boardUpdates.type && !AvailableTypes.isAvailableType(boardUpdates.type)) {
            throw new BadRequest(
                `Type '${boardUpdates.type}' is not a valid type. Valid types are${Object.values(AvailableTypes).map(
                    type => ` '${type}'`,
                )}.`,
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
            board = Boards.instantiateNewBoard(board);
        }

        // update existing board values and persist changes to the data storage
        Boards.log.debug(`Storing update for board with id ${Chalk.rgb(0, 143, 255).bold(board.id)} in the database.`);
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
                    new Conflict(
                        `Board with id ${board.id} is already running a program (${board.currentProgram}). Stop the currently running program or wait for it to finish.`,
                    ),
                );
                return;
            }

            // do not allow the user to execute a program on the board if the program doesn't support the board
            if (program.deviceType !== board.type && program.deviceType !== 'all') {
                reject(
                    new MethodNotAllowed(
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
            Boards.log.debug(`Storing new board with id ${Chalk.rgb(0, 143, 255).bold(board.id)} in the database.`);
            if (board.type !== board.constructor.name) {
                board = Boards.instantiateNewBoard(board);
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

export default Boards;
