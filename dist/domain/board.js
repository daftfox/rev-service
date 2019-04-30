"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../service/logger");
const command_error_1 = require("../error/command-error");
const chalk_1 = require("chalk");
/**
 * Generic representation of devices compatible with the firmata protocol
 *
 * @namespace Board
 */
class Board {
    /**
     * Creates a new instance of Board and awaits a successful connection before starting its heartbeat.
     *
     * @constructor
     * @param {FirmataBoard} firmataBoard
     * @param {string} id
     */
    constructor(firmataBoard, id) {
        /**
         * The current job the physical device is busy with. Defaults to 'IDLE' when it's not doing anything.
         *
         * @access public
         * @type {string}
         */
        this.currentJob = "IDLE";
        /**
         * This property is used to map available methods to string representations so we can easily
         * validate and call them from elsewhere. The mapping should be obvious.
         * Currently available methods are: BLINKON, BLINKOFF and TOGGLELED.
         *
         * @type {Object}
         * @access protected
         */
        this.availableActions = {
            BLINKON: () => { this.enableBlinkLed(true); },
            BLINKOFF: () => { this.enableBlinkLed(false); },
            TOGGLELED: () => { this.toggleLED(); },
            SETPINVALUE: (pin, value) => { this.setPinValue(parseInt(pin, 10), parseInt(value, 10)); },
        };
        /**
         * An array of intervals stored so we can clear them all at once using {@link Board.clearAllTimeouts} or {@link Board.clearAllTimers} when the moment is there.
         *
         * @access protected
         * @type {Timeout[]}
         */
        this.intervals = [];
        /**
         * An array of timeouts stored so we can clear them all at once using {@link Board.clearAllTimeouts} or {@link Board.clearAllTimers} when the moment is there.
         *
         * @access protected
         * @type {Timeout[]}
         */
        this.timeouts = [];
        // defaulted to Wemos D1 mini pinout for now
        /**
         * The pinout set for generic boards. This is currently set to the pinout for Wemos D1 (mini) boards, as these are
         * the ones I use during development.
         *
         * @type {IPinout}
         */
        this.pinout = {
            LED: 2,
            RX: 13,
            TX: 15
        };
        /**
         * Array that is used to store the value measured by analog pins for later comparison.
         *
         * @access private
         * @type {number[]}
         */
        this.previousAnalogValue = [];
        this.firmataBoard = firmataBoard;
        this.id = id;
        this.type = this.constructor.name;
        this.namespace = `board_${this.id}`;
        this.log = new logger_1.default(this.namespace);
        // set analog pin sampling rate at 1 second to prevent an overload of updates
        this.firmataBoard.setSamplingInterval(1000);
        this.attachAnalogPinListeners();
        this.attachDigitalPinListeners();
        this.startHeartbeat();
    }
    /**
     * Method returning a string array containing the actions this device is able to execute.
     *
     * @return {string[]} String array containing the available actions
     */
    getAvailableActions() {
        return Object.keys(this.availableActions);
    }
    /**
     * Allows the user to define a different pinout for the device than is set by default.
     * Default is defined in {@link Board.pinout}
     *
     * @param {IPinout} pinout
     * @returns {void}
     */
    setPinout(pinout) {
        Object.assign(this.pinout, pinout);
    }
    /**
     * Return an {@link IBoard}.
     *
     * @static
     * @access public
     * @param {Board} board
     * @returns {IBoard} An object representing a {@link IBoard} instance, but without the overhead and methods.
     */
    static toDiscrete(board) {
        return {
            id: board.id,
            vendorId: board.vendorId,
            productId: board.productId,
            type: board.type,
            currentJob: board.currentJob,
            commands: board.getAvailableActions(),
            pins: board.firmataBoard.pins
                .map((pin, index) => Object.assign({ pinNumber: index, analog: pin.analogChannel != 127 }, pin))
                .filter((pin) => pin.supportedModes.length > 0)
        };
    }
    /**
     * Return an array of {@link IBoard}.
     *
     * @static
     * @access public
     * @param {Board[]} boards
     * @returns {IBoard[]}
     */
    static toDiscreteArray(boards) {
        return boards.map(Board.toDiscrete);
    }
    /**
     * Execute an action. Checks if the action is actually available before attempting to execute it.
     *
     * @access public
     * @param {string} action
     * @param {string} parameter
     * @returns {void}
     */
    executeAction(action, ...parameter) {
        if (!this.isAvailableAction(action))
            throw new command_error_1.default(`'${chalk_1.default.rgb(67, 230, 145).bold(action)}' is not a valid action.`);
        this.log.debug(`Executing method ${chalk_1.default.rgb(67, 230, 145).bold(action)}.`);
        this.availableActions[action](parameter);
        this.firmataBoard.emit('update');
    }
    /**
     * Clear all timeouts and intervals. This is required when a physical device is disconnected.
     *
     * @returns {void}
     */
    clearAllTimers() {
        this.clearAllIntervals();
        this.clearAllTimeouts();
        this.firmataBoard.removeAllListeners();
    }
    /**
     * Clear an interval that was set by this {@link Board} instance.
     *
     * @param {NodeJS.Timeout} interval
     * @returns {void}
     */
    clearInterval(interval) {
        this.intervals.splice(this.intervals.indexOf(interval), 1);
        clearInterval(interval);
    }
    /**
     * Clear a timeout that was set by this {@link Board} instance.
     *
     * @param {NodeJS.Timeout} timeout
     * @returns {void}
     */
    clearTimeout(timeout) {
        this.timeouts.splice(this.timeouts.indexOf(timeout), 1);
        clearTimeout(timeout);
    }
    /**
     * Enable or disable the builtin LED blinking
     *
     * @param {boolean} enable
     * @access protected
     * @returns {void}
     */
    enableBlinkLed(enable) {
        if (enable) {
            if (this.blinkInterval) {
                this.log.warn(`LED blink is already enabled.`);
                return;
            }
            // set the current job to 'BLINKON'
            this.currentJob = "BLINKON";
            this.blinkInterval = setInterval(this.toggleLED.bind(this), 500);
            this.intervals.push(this.blinkInterval);
        }
        else {
            // reset the current job to 'IDLE'
            this.resetCurrentJob();
            this.clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }
    }
    /**
     * Toggle the builtin LED on / off. Turns it on if it's off and vice versa.
     *
     * @access protected
     * @returns {void}
     */
    toggleLED() {
        this.setPinValue(this.pinout.LED, this.firmataBoard.pins[this.pinout.LED].value === 1 /* HIGH */ ? 0 /* LOW */ : 1 /* HIGH */);
    }
    /**
     * Starts an interval requesting the physical board to send its firmware version every 10 seconds.
     * Emits a 'disconnect' event on the local {@link Board.firmataBoard} instance if the device fails to respond within 2 seconds of this query being sent.
     * The device is deemed disconnected and removed from the data model until it attempts reconnecting after the disconnect event is emitted.
     *
     * @access protected
     * @emits FirmataBoard.disconnect
     * @returns {void}
     */
    startHeartbeat() {
        const heartbeat = setInterval(() => {
            // set a timeout to emit a disconnect event if the physical device doesn't reply within 2 seconds
            const heartbeatTimeout = setTimeout(() => {
                this.log.warn(`Heartbeat timeout.`);
                // emit disconnect event after which the board is removed from the data model
                this.firmataBoard.emit('disconnect');
                this.clearInterval(heartbeat);
                this.clearTimeout(heartbeatTimeout);
            }, 2000);
            this.timeouts.push(heartbeatTimeout);
            // we utilize the queryFirmware method to emulate a heartbeat
            this.firmataBoard.queryFirmware(() => {
                this.clearTimeout(heartbeatTimeout);
            });
        }, Board.heartbeatInterval);
        this.intervals.push(heartbeat);
    }
    /**
     * Sets {@link Board.currentJob} to 'IDLE'
     *
     * @access protected
     * @returns {void}
     */
    resetCurrentJob() {
        this.currentJob = "IDLE";
    }
    /**
     * Writes a character byte-array to a device's serial UART interface.
     *
     * @access private
     * @param {string} payload String to send
     * @param {FirmataBoard.SERIAL_PORT_ID} serialPort Serial port on which to send
     * @returns {void}
     */
    serialWrite(serialPort, payload) {
        const bytes = [...payload].map(str => str.charCodeAt(0));
        this.firmataBoard.serialWrite(serialPort, bytes);
    }
    /**
     * Emits an 'update' event
     *
     * @emits FirmataBoard.update
     * @returns {void}
     */
    emitUpdate() {
        this.firmataBoard.emit('update');
    }
    /**
     * Write a value to a pin. Automatically distinguishes between analog and digital pins and calls the corresponding methods.
     *
     * @access protected
     * @param {number} pin
     * @param {number} value
     * @returns {void}
     */
    setPinValue(pin, value) {
        if (this.isAnalogPin(pin)) {
            this.firmataBoard.analogWrite(pin, value);
        }
        else if (this.isDigitalPin(pin)) {
            if (value !== 1 /* HIGH */ && value !== 0 /* LOW */) {
                this.log.warn(`Tried to write value ${value} to digital pin ${pin}. Only values 1 (HIGH) or 0 (LOW) are allowed.`);
            }
            else {
                this.firmataBoard.digitalWrite(pin, value);
            }
        }
        this.emitUpdate();
    }
    /**
     * Attaches listeners to all digital pins whose modes ({@link FirmataBoard.PIN_MODE}) are setup as INPUT pins.
     * Once the pin's value changes an 'update' event will be emitted by calling the {@link Board.emitUpdate} method.
     *
     * @access private
     * @returns {void}
     */
    attachDigitalPinListeners() {
        this.firmataBoard.pins.forEach((pin, index) => {
            if (this.isDigitalPin(index)) {
                this.firmataBoard.digitalRead(index, this.emitUpdate.bind(this));
            }
        });
    }
    /**
     * Attaches listeners to all analog pins.
     * Once the pin's value changes an 'update' event will be emitted by calling the {@link Board.emitUpdate} method.
     *
     * @access private
     * @returns {void}
     */
    attachAnalogPinListeners() {
        this.firmataBoard.analogPins.forEach((pin, index) => {
            this.firmataBoard.analogRead(index, (value) => {
                this.compareAnalogReadout(pin, value);
            });
        });
    }
    /**
     * Calls {@link Board.emitUpdate} if the current value differs from the previously measured value.
     *
     * @param {number} pinIndex
     * @param {number} value
     * @returns {void}
     */
    compareAnalogReadout(pinIndex, value) {
        if (this.previousAnalogValue[pinIndex] !== value) {
            this.previousAnalogValue[pinIndex] = value;
            this.emitUpdate();
        }
    }
    /**
     * Clear all intervals stored in {@link Board.intervals}.
     *
     * @access private
     * @returns {void}
     */
    clearAllIntervals() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
    /**
     * Clear all timeouts stored in {@link Board.timeouts}.
     *
     * @access private
     * @returns {void}
     */
    clearAllTimeouts() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts = [];
    }
    /**
     * Check if the action received is valid from the list of {@link Board.availableActions}.
     *
     * @access private
     * @param {string} action The command to check for availability
     * @returns {boolean} True if the command is valid, false if not
     */
    isAvailableAction(action) {
        return this.getAvailableActions().indexOf(action) >= 0;
    }
    /**
     * Checks whether a pin is a digital pin.
     *
     * @access private
     * @param {number} pinIndex
     * @returns {boolean}
     */
    isDigitalPin(pinIndex) {
        const pin = this.firmataBoard.pins[pinIndex];
        return pin.analogChannel === 127 && pin.supportedModes.length > 0 && !pin.supportedModes.includes(2 /* ANALOG */);
    }
    /**
     * Check whether a pin is an analog pin.
     *
     * @access private
     * @param {number} pinIndex
     * @returns {boolean}
     */
    isAnalogPin(pinIndex) {
        const pin = this.firmataBoard.pins[pinIndex];
        return pin.supportedModes.includes(2 /* ANALOG */);
    }
}
/**
 * The interval at which to send out a heartbeat. The heartbeat is used to 'test' the TCP connection with the physical
 * device. If the device doesn't respond within 2 seconds after receiving a heartbeat request, it is deemed disconnected
 * and removed from the data model until it attempts reconnecting.
 *
 * @static
 * @readonly
 * @access private
 * @type {number}
 */
Board.heartbeatInterval = 3000;
exports.default = Board;
//# sourceMappingURL=board.js.map