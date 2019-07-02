"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Board_1;
const FirmataBoard = require("firmata");
const logger_1 = require("../service/logger");
const command_unavailable_1 = require("../error/command-unavailable");
const chalk_1 = require("chalk");
const command_malformed_1 = require("../error/command-malformed");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
/**
 * Generic representation of devices compatible with the firmata protocol
 *
 * @namespace Board
 */
let Board = Board_1 = class Board extends sequelize_typescript_1.Model {
    /**
     * Creates a new instance of Board and awaits a successful connection before starting its heartbeat.
     *
     * @constructor
     * @param {Model} model
     * @param {sequelize.BuildOptions} buildOptions
     * @param {FirmataBoard} firmataBoard
     * @param {string} id
     */
    constructor(model, buildOptions, firmataBoard, serialConnection = false, id) {
        super(model, buildOptions);
        /**
         * Boolean stating wether the board is online or not.
         * @type {boolean}
         * @access public
         * @default [false]
         */
        this.online = false;
        /**
         * The current program the physical device is running. Defaults to 'IDLE' when it's not doing anything.
         *
         * @access public
         * @type {string}
         * @default ["idle"]
         */
        this.currentProgram = exports.IDLE;
        /**
         * This property is used to map available methods to string representations so we can easily
         * validate and call them from elsewhere. The mapping should be obvious.
         * Currently available methods are: BLINKON, BLINKOFF and TOGGLELED.
         *
         * @type {Object}
         * @access protected
         */
        this.availableActions = {
            BLINKON: { requiresParams: false, method: () => { this.enableBlinkLed(true); } },
            BLINKOFF: { requiresParams: false, method: () => { this.enableBlinkLed(false); } },
            TOGGLELED: { requiresParams: false, method: () => { this.toggleLED(); } },
            SETPINVALUE: { requiresParams: true, method: (pin, value) => { this.setPinValue(parseInt(pin, 10), parseInt(value, 10)); } },
        };
        /**
         * An array of intervals stored so we can clear them all at once using {@link Board.clearAllTimeouts} or {@link Board.clearAllTimers} when the moment is there.
         *
         * @access protected
         * @type {Timeout[]}
         * @default [[]]
         */
        this.intervals = [];
        /**
         * An array of timeouts stored so we can clear them all at once using {@link Board.clearAllTimeouts} or {@link Board.clearAllTimers} when the moment is there.
         *
         * @access protected
         * @type {Timeout[]}
         * @default [[]]
         */
        this.timeouts = [];
        /**
         * The pinMapping set for generic boards. This is currently set to the pinMapping for Arduino Uno boards.
         *
         * @type {IPinMapping}
         * @default [{ LED: 13, RX: 0, TX: 1 }]
         */
        this.pinMapping = exports.PIN_MAPPING.ARDUINO_UNO;
        this.pinout = PINOUT.ARDUINO_UNO;
        /**
         * Array that is used to store the value measured by analog pinMapping for later comparison.
         *
         * @access private
         * @type {number[]}
         * @default [[]]
         */
        this.previousAnalogValue = [];
        this.serialConnection = false;
        this.resetHeartbeatTimeout = () => {
            this.clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        };
        /**
         * Emits an 'update' event
         *
         * @emits FirmataBoard.update
         * @returns {void}
         */
        this.emitUpdate = () => {
            this.lastUpdateReceived = new Date().toUTCString();
            this.firmataBoard.emit('update', Board_1.toDiscrete(this));
        };
        this.id = id;
        this.namespace = `board_${this.id}`;
        this.log = new logger_1.default(this.namespace);
        if (firmataBoard) {
            this.online = true;
            this.firmataBoard = firmataBoard;
            this.serialConnection = serialConnection;
            if (this.pinout !== PINOUT.ARDUINO_UNO) {
                this.setPinout(this.pinout);
            }
            if (this.serialConnection) {
                this.firmataBoard.setSamplingInterval(200);
            }
            else {
                this.firmataBoard.setSamplingInterval(1000);
            }
            this.attachAnalogPinListeners();
            this.attachDigitalPinListeners();
            this.startHeartbeat();
        }
    }
    /**
     * Method returning a string array containing the actions this device is able to execute.
     *
     * @access public
     * @return {{action: string, requiresParams: boolean}[]} String array containing the available actions.
     */
    getAvailableActions() {
        const actionNames = Object.keys(this.availableActions);
        return actionNames.map(action => ({ name: action, requiresParams: this.availableActions[action].requiresParams }));
    }
    /**
     * Allows the user to define a different pinMapping for the device than is set by default.
     * Default is defined in {@link Board.pinMapping}
     *
     * @param {IPinMapping} pinout - The pinMapping to save to this board.
     * @returns {void}
     */
    setPinout(pinout) {
        let mappedPins = {};
        switch (pinout) {
            case PINOUT.ARDUINO_UNO:
                Object.assign(mappedPins, exports.PIN_MAPPING.ARDUINO_UNO);
                break;
            case PINOUT.ESP_8266:
                Object.assign(mappedPins, exports.PIN_MAPPING.ESP_8266);
                break;
            default:
                throw Error('This pinout is not supported.');
        }
        this.pinout = pinout;
        Object.assign(this.pinMapping, mappedPins);
    }
    /**
     * Sets {@link Board.currentProgram} to 'idle'
     *
     * @access public
     * @returns {void}
     */
    setIdle() {
        this.currentProgram = exports.IDLE;
    }
    /**
     * Return the board's instance of {@link FirmataBoard}
     *
     * @access public
     * @return {FirmataBoard}
     */
    getFirmataBoard() {
        return this.firmataBoard;
    }
    /**
     * Return an {@link IBoard}.
     *
     * @static
     * @access public
     * @param {Board} board - The {@link Board} instance to convert to an object implementing the {@link IBoard} interface.
     * @returns {IBoard} An object representing a {@link IBoard} instance, but without the overhead and methods.
     */
    static toDiscrete(board) {
        let discreteBoard;
        if (board) {
            discreteBoard = {
                id: board.id,
                name: board.name,
                vendorId: board.vendorId,
                productId: board.productId,
                type: board.type,
                currentProgram: board.currentProgram,
                online: board.online,
                serialConnection: board.serialConnection,
                lastUpdateReceived: board.lastUpdateReceived,
                pinout: board.pinout,
                availableCommands: board.getAvailableActions(),
            };
        }
        if (board.firmataBoard) {
            Object.assign(discreteBoard, {
                refreshRate: board.firmataBoard.getSamplingInterval(),
                pins: board.firmataBoard.pins
                    .map((pin, index) => Object.assign({ pinNumber: index, analog: pin.analogChannel != 127 }, pin))
                    .filter((pin) => pin.supportedModes.length > 0),
            });
        }
        else {
            Object.assign(discreteBoard, {
                pins: [],
            });
        }
        return discreteBoard;
    }
    /**
     * Return an array of {@link IBoard}.
     *
     * @static
     * @access public
     * @param {Board[]} boards - An array of {@link Board} instances to convert.
     * @returns {IBoard[]} An array of objects representing a {@link IBoard} instance, but without the overhead and methods.
     */
    static toDiscreteArray(boards) {
        return boards.map(Board_1.toDiscrete);
    }
    /**
     * Execute an action. Checks if the action is actually available before attempting to execute it.
     *
     * @access public
     * @param {string} action - The action to execute.
     * @param {string[]} [parameters] - The parameters to pass to the action method.
     * @returns {void}
     */
    executeAction(action, parameters) {
        if (!this.online)
            throw new command_unavailable_1.default(`Unable to execute command on this board since it is not online.`);
        if (!this.isAvailableAction(action))
            throw new command_unavailable_1.default(`'${action}' is not a valid action for board with id ${this.id}.`);
        this.log.debug(`Executing method ${chalk_1.default.rgb(67, 230, 145).bold(action)}.`);
        const method = this.availableActions[action].method;
        if (parameters && parameters.length) {
            method(...parameters);
        }
        else {
            method();
        }
        this.emitUpdate();
    }
    disconnect() {
        this.clearAllTimers();
        this.online = false;
        this.firmataBoard.removeAllListeners();
        this.firmataBoard = null;
    }
    /**
     * Clear all timeouts and intervals. This is required when a physical device is online or the Board class reinstantiated.
     *
     * @returns {void}
     */
    clearAllTimers() {
        this.clearAllIntervals();
        this.clearAllTimeouts();
        this.clearListeners();
    }
    clearListeners() {
        this.firmataBoard.pins.forEach((pin, index) => {
            if (this.isDigitalPin(index)) {
                this.firmataBoard.removeListener(`digital-read-${index}`, this.emitUpdate);
            }
        });
        this.firmataBoard.analogPins.forEach((pin, index) => {
            this.firmataBoard.removeListener(`analog-read-${index}`, this.emitUpdate);
        });
        this.firmataBoard.removeListener('queryfirmware', this.resetHeartbeatTimeout);
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
            this.blinkInterval = setInterval(this.toggleLED.bind(this), 500);
            this.intervals.push(this.blinkInterval);
        }
        else {
            // reset the current job to 'IDLE'
            this.setIdle();
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
        this.setPinValue(this.pinMapping.LED, this.firmataBoard.pins[this.pinMapping.LED].value === 1 /* HIGH */ ? 0 /* LOW */ : 1 /* HIGH */);
    }
    /**
     * Starts an interval requesting the physical board to send its firmware version every 10 seconds.
     * Emits a 'disconnect' event on the local {@link Board.firmataBoard} instance if the device fails to respond within 2 seconds of this query being sent.
     * The device is deemed online and removed from the data model until it attempts reconnecting after the disconnect event is emitted.
     *
     * @access protected
     * @emits FirmataBoard.disconnect
     * @returns {void}
     */
    startHeartbeat() {
        const heartbeat = setInterval(() => {
            // set a timeout to emit a disconnect event if the physical device doesn't reply within 2 seconds
            this.heartbeatTimeout = setTimeout(() => {
                this.log.debug(`Heartbeat timeout.`);
                // emit disconnect event after which the board is removed from the data model
                this.firmataBoard.emit('disconnect');
                this.clearInterval(heartbeat);
                this.resetHeartbeatTimeout();
            }, 10000);
            this.timeouts.push(this.heartbeatTimeout);
            // we utilize the queryFirmware method to emulate a heartbeat
            this.firmataBoard.queryFirmware(this.resetHeartbeatTimeout);
        }, Board_1.heartbeatInterval);
        this.intervals.push(heartbeat);
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
     * Write a value to a pin. Automatically distinguishes between analog and digital pinMapping and calls the corresponding methods.
     *
     * @access protected
     * @param {number} pin
     * @param {number} value
     * @returns {void}
     */
    setPinValue(pin, value) {
        if (pin === null) {
            throw new command_malformed_1.default(`Method setPinValue requires 'pin' argument.`);
        }
        if (value === null) {
            throw new command_malformed_1.default(`Method setPinValue requires 'value' argument.`);
        }
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
     * Attaches listeners to all digital pinMapping whose modes ({@link FirmataBoard.PIN_MODE}) are setup as INPUT pinMapping.
     * Once the pin's value changes an 'update' event will be emitted by calling the {@link Board.emitUpdate} method.
     *
     * @access private
     * @returns {void}
     */
    attachDigitalPinListeners() {
        this.firmataBoard.pins.forEach((pin, index) => {
            if (this.isDigitalPin(index)) {
                this.firmataBoard.digitalRead(index, this.emitUpdate);
            }
        });
    }
    /**
     * Attaches listeners to all analog pinMapping.
     * Once the pin's value changes an 'update' event will be emitted by calling the {@link Board.emitUpdate} method.
     *
     * @access private
     * @returns {void}
     */
    attachAnalogPinListeners() {
        this.firmataBoard.analogPins.forEach((pin, index) => {
            this.firmataBoard.analogRead(index, this.emitUpdate);
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
        return this.getAvailableActions().findIndex(_action => _action.name === action) >= 0;
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
};
/**
 * The interval at which to send out a heartbeat. The heartbeat is used to 'test' the TCP connection with the physical
 * device. If the device doesn't respond within 2 seconds after receiving a heartbeat request, it is deemed online
 * and removed from the data model until it attempts reconnecting.
 *
 * @static
 * @readonly
 * @access private
 * @type {number}
 * @default [5000]
 */
Board.heartbeatInterval = 10000;
__decorate([
    sequelize_typescript_1.Column({ primaryKey: true }),
    __metadata("design:type", String)
], Board.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Board.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Board.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Board.prototype, "lastUpdateReceived", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_1.STRING }),
    __metadata("design:type", String)
], Board.prototype, "pinout", void 0);
Board = Board_1 = __decorate([
    sequelize_typescript_1.Table({ timestamps: true }),
    __metadata("design:paramtypes", [Object, Object, FirmataBoard, Boolean, String])
], Board);
exports.default = Board;
exports.IDLE = "idle";
var PINOUT;
(function (PINOUT) {
    PINOUT["ARDUINO_UNO"] = "Arduino Uno";
    PINOUT["ESP_8266"] = "ESP8266";
})(PINOUT = exports.PINOUT || (exports.PINOUT = {}));
exports.PIN_MAPPING = {
    ARDUINO_UNO: {
        LED: 13,
        RX: 1,
        TX: 0,
    },
    ESP_8266: {
        LED: 2,
        RX: 4,
        TX: 5,
    }
};
//# sourceMappingURL=board.js.map