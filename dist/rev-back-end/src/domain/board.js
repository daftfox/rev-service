"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../service/logger");
const command_error_1 = require("../error/command-error");
const chalk_1 = require("chalk");
/**
 * Generic representation of devices compatible with the firmata protocol.
 *
 * @classdesc
 * @namespace Board
 */
class Board {
    /**
     * Creates a new instance of Board and awaits a successful connection before setting its status to READY
     * @constructor
     * @param {FirmataBoard} firmataBoard
     * @param {string} id
     */
    constructor(firmataBoard, id) {
        /**
         * The availableActions property is used to map available methods to string representations so we can easily
         * validate and call them from elsewhere. The mapping should be obvious.
         * @type {Object}
         * @access protected
         */
        this.availableActions = {};
        this.currentJob = "IDLE";
        this.firmataBoard = firmataBoard;
        this.id = id;
        this.timeouts = [];
        this.intervals = [];
        this.type = this.constructor.name;
        this.readyListener = () => {
            this.namespace = `board - ${this.id}`;
            this.log = new logger_1.default(this.namespace);
            this.log.info('Ready');
            this.startHeartbeat();
        };
        this.firmataBoard.on('ready', this.readyListener);
    }
    getAvailableCommands() {
        return Object.keys(this.availableActions);
    }
    /**
     * Return a minimal representation of the Board class
     * @static
     * @access public
     * @param {Board} board
     * @returns {Board} A small object representing a Board instance, but without the overhead and methods.
     */
    static toDiscrete(board) {
        return {
            id: board.id,
            vendorId: board.vendorId,
            productId: board.productId,
            type: board.type,
            currentJob: board.currentJob,
            commands: board.getAvailableActions()
        };
    }
    /**
     * Return an array of DiscreteBoards
     * @static
     * @access public
     * @param {Board[]} boards
     * @returns {Board[]}
     */
    static toDiscreteArray(boards) {
        return boards.map(Board.toDiscrete);
    }
    /**
     * Execute a command
     *
     * @access public
     * @param {CommandEvent} command
     */
    executeCommand(command) {
        this.log.debug(`Executing method ${chalk_1.default.rgb(67, 230, 145).bold(command.action)}.`);
        if (!this.isAvailableCommand(command))
            throw new command_error_1.default(`'${chalk_1.default.rgb(67, 230, 145).bold(command.action)}' is not a valid command.`);
        this.availableActions[command.action](command.parameter);
        this.firmataBoard.emit('update');
    }
    /**
     * Clear all timeouts and intervals. This is required when a physical device is disconnected.
     */
    clearAllTimers() {
        this.clearAllIntervals();
        this.clearAllTimeouts();
        this.firmataBoard.removeAllListeners();
    }
    /**
     * Clear an interval that was set by this Board instance.
     * @param {NodeJS.Timeout} interval
     */
    clearInterval(interval) {
        clearInterval(this.intervals.find(_interval => _interval === interval));
        this.intervals.splice(this.intervals.indexOf(interval), 1);
    }
    /**
     * Clear a timeout that was set by this Board instance.
     * @param {NodeJS.Timeout} timeout
     */
    clearTimeout(timeout) {
        clearTimeout(this.timeouts.find(_timeout => _timeout === timeout));
        this.timeouts.splice(this.timeouts.indexOf(timeout), 1);
    }
    /**
     * Clear all intervals set by this Board instance.
     */
    clearAllIntervals() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
    /**
     * Clear all timeouts set by this Board instance
     */
    clearAllTimeouts() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts = [];
    }
    /**
     * Starts an interval requesting the physical board to send its firmware version every 10 seconds.
     * Emits a disconnect event on its FirmataBoard instance if the device fails to respond within 2 seconds of this query being sent.
     * @return {void}
     */
    startHeartbeat() {
        const heartbeat = setInterval(() => {
            // set a timeout to emit a disconnect event if the physical device doesn't reply within 2 seconds
            const heartbeatTimeout = setTimeout(() => {
                this.log.warn(`Heartbeat timeout.`);
                this.firmataBoard.emit('disconnect');
                this.clearInterval(heartbeat);
                this.clearTimeout(heartbeatTimeout);
            }, 2000);
            this.timeouts.push(heartbeatTimeout);
            // we utilize the queryFirmware method to emulate a heartbeat
            this.firmataBoard.queryFirmware(() => {
                // heartbeat received
                this.log.debug(`${chalk_1.default.rgb(230, 67, 67).bold('❤')}`);
                this.firmataBoard.emit('update');
                this.clearTimeout(heartbeatTimeout);
            });
        }, Board.heartbeatInterval);
        this.intervals.push(heartbeat);
    }
    resetCurrentJob() {
        this.currentJob = "IDLE";
    }
    /**
     * Check if the command received is a valid command
     * @access private
     * @param {CommandEvent} command The command to check for availability
     * @returns {boolean} True if the command is valid, false if not
     */
    isAvailableCommand(command) {
        return this.getAvailableCommands().indexOf(command.action) >= 0;
    }
}
/**
 * The interval at which to send out a heartbeat
 * @static
 * @access private
 * @type {number}
 */
Board.heartbeatInterval = 10000;
exports.default = Board;
//# sourceMappingURL=board.js.map