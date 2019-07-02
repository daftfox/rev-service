"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const board_1 = require("../domain/board");
const logger_1 = require("../service/logger");
const chalk_1 = require("chalk");
const not_found_1 = require("../domain/web-socket-message/error/not-found");
const bad_request_1 = require("../domain/web-socket-message/error/bad-request");
const server_error_1 = require("../domain/web-socket-message/error/server-error");
const major_tom_1 = require("../domain/major-tom");
const conflict_1 = require("../domain/web-socket-message/error/conflict");
const method_not_allowed_1 = require("../domain/web-socket-message/error/method-not-allowed");
const led_controller_1 = require("../domain/led-controller");
/**
 * @description Data model for storing and sharing {@link Board}/{@link IBoard} instances across services.
 * @namespace Boards
 */
class Boards {
    constructor() {
        /**
         * Locally stored array of {@link Board} instances that are currently online.
         * This is pre-filled with devices retrieved from the data storage.
         *
         * @access private
         * @type {Board[]}
         */
        this._boards = [];
        /**
         * Array of listener methods that are called as soon as a new {@link Board} instance was added to the {@link _boards} array.
         * The newly added {@link IBoard} is passed to the listener method as an argument.
         *
         * @type {(function(IBoard) => void)[]}
         */
        this.boardConnectedListeners = [];
        /**
         * Array of listener methods that are called as soon as a {@link Board} instance has updated.
         * The updated {@link IBoard} is passed to the listener method as an argument.
         *
         * @type {(function(IBoard) => void)[]}
         */
        this.boardUpdatedListeners = [];
        /**
         * Array of listener methods that are called as soon as a {@link Board} instance was removed from the {@link _boards} array.
         * The removed {@link IBoard} is passed to the listener method as an argument.
         *
         * @type {(function(IBoard) => void)[]}
         */
        this.boardDisconnectedListeners = [];
        board_1.default.findAll()
            .then(boards => {
            this._boards = boards.map(board => Boards.instantiateBoard(board));
        });
    }
    /**
     * Create an instance of a {@link Board} reflecting its type.
     * Currently supported types are {@link Board} (default) and {@link MajorTom}, as dictated by {@link Boards.AVAILABLE_TYPES}.
     *
     * @param {Board} board - {@link Board} instance used to feed data values into the newly constructed instance.
     * @param {FirmataBoard} [firmataBoard] - Connected instance of {@link FirmataBoard} to attach to the newly created instance.
     * @returns {Board} New instance of {@link Board} or {@link MajorTom}.
     */
    static instantiateBoard(board, serialConnection = false, firmataBoard) {
        let boardInstance;
        const dataValues = {
            id: board.id,
            name: board.name,
            type: board.type,
            lastUpdateReceived: board.lastUpdateReceived,
        };
        switch (board.type) {
            case 'MajorTom':
                boardInstance = new major_tom_1.default(dataValues, { isNewRecord: board.isNewRecord }, firmataBoard, serialConnection);
                break;
            case 'LedController':
                boardInstance = new led_controller_1.default(dataValues, { isNewRecord: board.isNewRecord }, firmataBoard, serialConnection);
                break;
            default:
                boardInstance = new board_1.default(dataValues, { isNewRecord: board.isNewRecord }, firmataBoard, serialConnection);
                break;
        }
        return boardInstance;
    }
    /**
     * Add a new listener method to be called as soon as a new {@link Board} instance has online.
     *
     * @access public
     * @param {(IBoard) => void} listener - Callback method to execute when a {@link Board} instance has online.
     * @returns {void}
     */
    addBoardConnectedListener(listener) {
        this.boardConnectedListeners.push(listener);
    }
    /**
     * Add a new listener method to be called as soon as a {@link Board} instance has updated.
     *
     * @access public
     * @param {(IBoard) => void} listener - Callback method to execute when a {@link Board} instance has been updated.
     * @returns {void}
     */
    addBoardUpdatedListener(listener) {
        this.boardUpdatedListeners.push(listener);
    }
    /**
     * Add a new listener method to be called as soon as a {@link Board} instance has online.
     *
     * @access public
     * @param {(IBoard) => void} listener - Callback method to execute when a {@link Board} instance has been disconnected.
     * @returns {void}
     */
    addBoardDisconnectedListener(listener) {
        this.boardDisconnectedListeners.push(listener);
    }
    /**
     * Returns an array of the currently online boards.
     *
     * @access public
     * @return {IBoard[]} An array of objects implementing the {@link IBoard} interface, representing the currently online boards.
     */
    get boards() {
        return board_1.default.toDiscreteArray(this._boards);
    }
    /**
     * Returns the {@link Board} instance with the id supplied in the argument.
     *
     * @access public
     * @throws {BadRequest} Board id parameter missing.
     * @throws {NotFound} Board could not be found.
     * @param {string} id - ID of the {@link Board} instance to retrieve.
     * @return {IBoard} If found, an object implementing the {@link IBoard} interface.
     */
    getBoardById(id) {
        if (!id) {
            throw new bad_request_1.default(`Parameter board id is missing.`);
        }
        const board = this._boards
            .find(board => board.id === id);
        if (!board) {
            throw new not_found_1.default(`Board with id ${id} could not be found.`);
        }
        return board_1.default.toDiscrete(board);
    }
    /**
     * Adds {@link Board} instance to the model. If the device is unknown it will be persisted to the data storage.
     *
     * @async
     * @access public
     * @throws {ServerError} Board could not be stored.
     * @param {string} id - ID of the {@link Board} instance to add.
     * @param {string} type - {@link Board} type to use as default to create a new instance if no existing instances can be found.
     * @param {FirmataBoard} firmataBoard - Connected instance of {@link FirmataBoard} to attach to the {@link Board} instance to be returned.
     * @returns {Promise<IBoard>} A promise that resolves to an object implementing the {@link IBoard} interface once the board has been added successfully.
     */
    addBoard(id, type, firmataBoard, serialConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            // fill variable with an instance of Board, either retrieved from the data storage, or newly constructed.
            const board = yield Boards.findOrBuildBoard(id, type, firmataBoard, serialConnection);
            const newRecord = board.isNewRecord;
            if (newRecord) {
                // store the Board in the data storage and append it to the local storage array if it is new
                Boards.log.debug(`Storing new board with id ${chalk_1.default.rgb(0, 143, 255).bold(board.id)} in the database.`);
                try {
                    yield board.save();
                }
                catch (error) {
                    throw new server_error_1.default(`Board could not be stored.`);
                }
                this._boards.push(board);
            }
            else {
                // replace existing Board instance in the local storage array with the newly instantiated Board
                this._boards[this._boards.findIndex(board => board.id === board.id)] = board;
            }
            // retrieve a lean copy of the Board instance
            const discreteBoard = board_1.default.toDiscrete(board);
            this.boardConnectedListeners.forEach(listener => listener(discreteBoard, newRecord));
            return Promise.resolve(discreteBoard);
        });
    }
    /**
     * Disconnect a {@link Board} instance and removes it from the database.
     *
     * @access public
     * @param {string} id - ID of the {@link Board} instance to delete.
     * @returns {void}
     */
    deleteBoard(id) {
        Boards.log.debug(`Deleting board with id ${chalk_1.default.rgb(0, 143, 255).bold(id)} from the database.`);
        this.disconnectBoard(id);
        this._boards.find(board => board.id === id).destroy();
    }
    /**
     * Disconnect a {@link Board} instance and notify subscribers.
     *
     * @access public
     * @param {string} id - ID of the {@link Board} instance to disconnect.
     * @returns {void}
     */
    disconnectBoard(id) {
        Boards.log.debug(`Setting board with id ${chalk_1.default.rgb(0, 143, 255).bold(id)}'s status to disconnected.`);
        const board = this._boards.find(board => board.id === id);
        if (board) {
            board.disconnect();
            board.save();
            const discreteBoard = board_1.default.toDiscrete(board);
            const index = this._boards.findIndex(board => board.id === id);
            this._boards[index] = board;
            this.boardDisconnectedListeners.forEach(listener => listener(discreteBoard));
        }
    }
    /**
     * Update a {@link Board} and notify subscribers.
     *
     * @access public
     * @throws {BadRequest} The provided type is not a valid type.
     * @throws {BadRequest} Parameter board id is missing.
     * @throws {BadRequest} Parameter board is missing.
     * @param {IBoard} boardUpdates - Object implementing the {@link IBoard} interface containing updated values for an existing {@link Board} instance.
     * @param {boolean} [persist = false] - Persist the changes to the data storage.
     * @returns {void}
     */
    updateBoard(boardUpdates, persist = false) {
        if (!boardUpdates) {
            throw new bad_request_1.default(`Parameter board is missing.`);
        }
        if (!boardUpdates.id) {
            throw new bad_request_1.default(`Parameter board id is missing.`);
        }
        let board = this._boards.find(board => board.id === boardUpdates.id);
        if (board) {
            // do not allow the user to change the Board.type property into an unsupported value
            if (boardUpdates.type && !Object.values(Boards.AVAILABLE_TYPES).includes(boardUpdates.type)) {
                throw new bad_request_1.default(`Type '${boardUpdates.type}' is not a valid type. Valid types are${Object.values(Boards.AVAILABLE_TYPES).map(type => ` '${type}'`)}.`);
            }
            // update existing board values
            Object.assign(board, boardUpdates);
            if (persist) {
                // persist instance changes to the data storage
                Boards.log.debug(`Storing update for board with id ${chalk_1.default.rgb(0, 143, 255).bold(boardUpdates.id)} in the database.`);
                board.save();
                if (board.previous('pinout') && board.previous('pinout') !== board.getDataValue('pinout')) {
                    board.setPinout(board.pinout);
                }
                // re-instantiate previous board to reflect type changes
                if (board.previous('type') && board.previous('type') !== board.getDataValue('type')) {
                    const index = this._boards.findIndex(board => board.id === boardUpdates.id);
                    // clear non-essential timers and listeners
                    if (board.online) {
                        this._boards[index].clearAllTimers();
                    }
                    // create new instance if board is online and attach the existing online FirmataBoard instance to it
                    board = Boards.instantiateBoard(board, board.serialConnection, board.getFirmataBoard());
                    this._boards[index] = board;
                }
            }
            const discreteBoard = board_1.default.toDiscrete(board);
            this.boardUpdatedListeners.forEach(listener => listener(discreteBoard));
        }
    }
    /**
     * Execute an action on {@link Board} belonging to the supplied ID.
     *
     * @access public
     * @throws {MethodNotAllowed} Requested action not available for board.
     * @param {string} id - ID of the {@link Board} instance to execute the action on.
     * @param {ICommand} command - Command to execute.
     * @returns {Promise<void>} A promise that resolves once the action has been executed successfully.
     */
    executeActionOnBoard(id, command) {
        const board = this._boards.find(board => board.id === id);
        let timeout;
        return new Promise((resolve, reject) => {
            try {
                board.executeAction(command.action, command.parameters);
                timeout = setTimeout(resolve, command.duration || 100);
            }
            catch (error) {
                clearTimeout(timeout);
                reject(new method_not_allowed_1.default(error.message));
            }
        });
    }
    /**
     * Stop a {@link Board} instance from running its current {@link Program}.
     *
     * @access public
     * @param {string} id - ID of the {@link Board} instance that should stop running its {@link Program}.
     */
    stopProgram(id) {
        const board = this._boards.find(board => board.id === id);
        board.currentProgram = board_1.IDLE;
    }
    /**
     * Executes the program on the supplied board.
     *
     * @async
     * @access public
     * @throws {Conflict} Board is already busy running a program.
     * @throws {MethodNotAllowed} Program cannot be run on this board.
     * @param {string} id - ID of the board to execute the program on.
     * @param {Program} program - The program to execute.
     * @param {number} [repeat = 1] - How often the program should be executed. Set to -1 for indefinitely.
     * @returns {Promise<void>} Promise that resolves once the program has executed successfully.
     */
    executeProgramOnBoard(id, program, repeat = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const board = this._boards.find(board => board.id === id);
            // do not allow the user to execute a program on the board if it is already busy executing one
            if (board.currentProgram !== board_1.IDLE) {
                return Promise.reject(new conflict_1.default(`Board with id ${board.id} is already running a program (${board.currentProgram}). Stop the currently running program or wait for it to finish.`));
            }
            // do not allow the user to execute a program on the board if the program doesn't support the board
            if (program.deviceType !== board.type && program.deviceType !== 'all') {
                return Promise.reject(new method_not_allowed_1.default(`The program ${program.name} cannot be run on board with id ${id}, because it is of the wrong type. Program ${program.name} can only be run on devices of type ${program.deviceType}.`));
            }
            // set the board's current program status
            board.currentProgram = program.name;
            const discreteBoard = board_1.default.toDiscrete(board);
            try {
                if (repeat === -1) {
                    // execute program indefinitely
                    while (board.currentProgram !== program.name) {
                        yield this.runProgram(discreteBoard, program);
                    }
                }
                else {
                    // execute program n times
                    for (let repetition = 0; repetition < repeat; repetition++) {
                        yield this.runProgram(discreteBoard, program);
                    }
                }
            }
            catch (error) {
                new method_not_allowed_1.default(error.message);
            }
            // set the board's current program status to 'idle'
            this.stopProgram(board.id);
            return Promise.resolve();
        });
    }
    /**
     * Find or instantiate a {@link Board} instance.
     *
     * @async
     * @static
     * @access private
     * @param {string} id - ID of the {@link Board} instance to retrieve.
     * @param {string} type - {@link Board.AVAILABLE_TYPES} type to use as default to create a new {@link Board} instance if no existing instances can be found.
     * @param {FirmataBoard} firmataBoard - Connected instance of {@link FirmataBoard} to attach to the {@link Board} instance to be returned.
     * @returns {Promise<Board>} Promise that resolves to an instance of {@link Board} after an instance has been found or created.
     */
    static findOrBuildBoard(id, type, firmataBoard, serialConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            let [board] = yield board_1.default.findOrBuild({
                where: {
                    id: id,
                },
                defaults: {
                    id: id,
                    type: type,
                }
            });
            board = Boards.instantiateBoard(board, serialConnection, firmataBoard);
            return Promise.resolve(board);
        });
    }
    /**
     * Run a {@link Program} on a {@link Board}.
     *
     * @async
     * @private
     * @access private
     * @param {IBoard} board - Discrete board instance to run {@link Program} on.
     * @param {Program} program - {@link Program} to run.
     * @returns {Promise<void>} Promise that resolves when a program has finished running.
     */
    runProgram(board, program) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let command of program.getCommands()) {
                // stop executing the program as soon as the board's program status changes
                if (board.currentProgram !== program.name) {
                    break;
                }
                try {
                    yield this.executeActionOnBoard(board.id, command);
                }
                catch (error) {
                    return Promise.reject(error);
                }
            }
            return Promise.resolve();
        });
    }
}
/**
 * Static object containing types that are currently supported by the system.
 *
 * @static
 * @type {object}
 */
Boards.AVAILABLE_TYPES = {
    MAJORTOM: 'MajorTom',
    BOARD: "Board",
    LEDCONTROLLER: "LedController",
};
/**
 * Namespace used by the local instance of {@link Logger}
 *
 * @static
 * @access private
 * @type {string}
 */
Boards.namespace = 'board-model';
/**
 * Local instance of the {@link Logger} class.
 *
 * @static
 * @access private
 * @type {Logger}
 */
Boards.log = new logger_1.default(Boards.namespace);
exports.default = Boards;
//# sourceMappingURL=boards.js.map