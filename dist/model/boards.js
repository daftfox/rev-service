"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../service/logger");
const chalk_1 = require("chalk");
/**
 * @classdesc Data model for storing and sharing {@link Board} instances across services.
 * @namespace Boards
 */
class Boards {
    constructor() {
        /**
         * Locally stored array of boards that are currently connected.
         *
         * @access private
         * @type {Board[]}
         */
        this._boards = [];
        /**
         * Array of listener methods that are called as soon as a new device was added to the {@link _boards} array.
         * The newly added {@link Board} is passed to the listener method as an argument.
         *
         * @type {(function(Board) => void)[]}
         */
        this.notifyBoardConnectedListeners = [];
        /**
         * Array of listener methods that are called as soon as a device has updated.
         * The updated {@link Board} is passed to the listener method as an argument.
         *
         * @type {(function(Board) => void)[]}
         */
        this.notifyBoardUpdatedListeners = [];
        /**
         * Array of listener methods that are called as soon as a device was removed from the {@link _boards} array.
         * The removed {@link Board} is passed to the listener method as an argument.
         *
         * @type {(function(Board) => void)[]}
         */
        this.notifyBoardDisconnectedListeners = [];
        /**
         * Local instance of the {@link Logger} class.
         *
         * @access private
         * @type {Logger}
         */
        this.log = new logger_1.default(Boards.namespace);
    }
    /**
     * Add a new listener method to be called as soon as a new board has connected.
     *
     * @access public
     * @param {(Board) => void} listener
     * @returns {void}
     */
    addBoardConnectedListener(listener) {
        this.notifyBoardConnectedListeners.push(listener);
    }
    /**
     * Add a new listener method to be called as soon as a board has updated.
     *
     * @access public
     * @param {(Board) => void} listener
     * @returns {void}
     */
    addBoardUpdatedListener(listener) {
        this.notifyBoardUpdatedListeners.push(listener);
    }
    /**
     * Add a new listener method to be called as soon as a board has disconnected.
     *
     * @access public
     * @param {(Board) => void} listener
     * @returns {void}
     */
    addBoardDisconnectedListener(listener) {
        this.notifyBoardDisconnectedListeners.push(listener);
    }
    /**
     * Returns an array of the currently connected boards.
     *
     * @access public
     * @return {Board[]}
     */
    get boards() {
        return this._boards;
    }
    /**
     * Returns an observable containing the board with the id supplied in the argument.
     *
     * @access public
     * @param {string} id
     * @return {Board}
     */
    getBoardById(id) {
        return this._boards.find(board => board.id === id);
    }
    /**
     * Add a new board and notify subscribers.
     *
     * @access public
     * @param {Board} board
     * @returns {void}
     */
    addBoard(board) {
        this.log.debug(`Adding new board with id ${chalk_1.default.rgb(0, 143, 255).bold(board.id)} to list of available boards.`);
        this._boards.push(board);
        this.notifyBoardConnectedListeners.forEach(listener => listener(board));
    }
    /**
     * Register the supplied board as disconnected and notify subscribers.
     *
     * @access public
     * @param {string} boardId
     * @returns {void}
     */
    removeBoard(boardId) {
        this.log.debug(`Removing board with id ${chalk_1.default.rgb(0, 143, 255).bold(boardId)} from list of available boards.`);
        const removedBoard = this._boards.splice(this._boards.findIndex(board => board.id === boardId), 1).shift();
        if (removedBoard) {
            removedBoard.clearAllTimers();
            this.notifyBoardDisconnectedListeners.forEach(listener => listener(removedBoard));
        }
    }
    /**
     * Update subscribers that a board has updated.
     *
     * @access public
     * @param updatedBoard
     * @returns {void}
     */
    updateBoard(updatedBoard) {
        this.notifyBoardUpdatedListeners.forEach(listener => listener(updatedBoard));
    }
}
/**
 * Namespace used by the local instance of {@link Logger}
 *
 * @static
 * @access private
 * @type {string}
 */
Boards.namespace = 'model';
exports.default = Boards;
//# sourceMappingURL=boards.js.map