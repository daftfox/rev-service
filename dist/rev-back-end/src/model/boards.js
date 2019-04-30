"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const not_found_error_1 = require("../error/not-found-error");
const logger_1 = require("../service/logger");
const chalk_1 = require("chalk");
/**
 * @classdesc
 * @namespace Boards
 */
class Boards {
    constructor() {
        /**
         * @access private
         * @type {Board[]}
         */
        this._boards = [];
        this.notifyBoardConnectedListeners = [];
        this.notifyBoardUpdatedListeners = [];
        this.notifyBoardDisconnectedListeners = [];
        this.log = new logger_1.default(Boards.namespace);
    }
    addBoardConnectedListener(listener) {
        this.notifyBoardConnectedListeners.push(listener);
    }
    addBoardUpdatedListener(listener) {
        this.notifyBoardUpdatedListeners.push(listener);
    }
    addBoardDisconnectedListener(listener) {
        this.notifyBoardDisconnectedListeners.push(listener);
    }
    /**
     * Returns an array of the currently connected boards
     * @access public
     * @return {Board[]}
     */
    get boards() {
        return this._boards;
    }
    /**
     * Returns an observable containing the board with the id supplied in the argument
     * @access public
     * @param {string} id
     * @return {Board}
     */
    getBoardById(id) {
        return this._boards.find(board => board.id === id);
    }
    /**
     * Add a new board and notify subscribers
     * @access public
     * @param {Board} board
     */
    addBoard(board) {
        this.log.debug(`Adding new board with id ${chalk_1.default.rgb(0, 143, 255).bold(board.id)} to list of available boards.`);
        this._boards.push(board);
        this.notifyBoardConnectedListeners.forEach(listener => listener(board));
    }
    /**
     * Register the supplied board as disconnected and notify subscribers
     * @access public
     * @param {string} boardId
     */
    removeBoard(boardId) {
        this.log.debug(`Removing board with id ${chalk_1.default.rgb(0, 143, 255).bold(boardId)} from list of available boards.`);
        const removedBoard = this._boards.splice(this._boards.findIndex(board => board.id === boardId), 1).shift();
        if (removedBoard) {
            removedBoard.clearAllTimers();
            this.notifyBoardDisconnectedListeners.forEach(listener => listener(removedBoard));
        }
    }
    updateBoard(updatedBoard) {
        this.notifyBoardUpdatedListeners.forEach(listener => listener(updatedBoard));
    }
    /**
     * Consumes a CommandEvent object and executes it on the board specified by its boardId property
     * @access public
     * @param {ICommandEvent} command
     */
    executeCommand(command) {
        const board = this._boards.find(board => board.id === command.boardId);
        if (!board)
            throw new not_found_error_1.default(`Board with id ${chalk_1.default.rgb(0, 143, 255).bold(command.boardId)} not found`);
        else {
            board.executeCommand(command);
        }
    }
}
Boards.namespace = 'model';
exports.default = Boards;
//# sourceMappingURL=boards.js.map