import * as FirmataBoard from 'firmata';
import LoggerService from '../service/logger-service';
import CommandUnavailableError from '../error/command-unavailable';
import Timeout = NodeJS.Timeout;
import Chalk from 'chalk';
import IBoard from './interface/board';
import IPinMapping from './interface/pin-map';
import IPin from './interface/pin';
import CommandMalformed from '../error/command-malformed';
import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import BoardArchitecture from './board-architecture';
import { SupportedBoards } from './supported-boards';
import AvailableTypes from './available-types';

/**
 * Generic representation of devices compatible with the firmata protocol
 *
 * @namespace Board
 */
@Table({ timestamps: true })
class Board extends Model<Board> implements IBoard {
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
    private static readonly heartbeatInterval = 10000;
    private static readonly disconnectTimeout = 10000;

    /**
     * The unique identifier by which the board will be known to the outside world. The ID is defined by the filename
     * of the firmware that is flashed to the device. The filename should look like the following example:
     * <generic_name>_<unique_identifier>.ino
     * This is persisted in the database.
     *
     * @type {string}
     * @access public
     */
    @Column({ type: DataType.STRING, primaryKey: true })
    public id: string;

    /**
     * A custom name, to be given by the user.
     * This is persisted in the database.
     *
     * @type {string}
     * @access public
     */
    @Column(DataType.STRING)
    public name: string;

    /**
     * String containing the type of device the {@link Board} instance represents. This could be a generic device (thus containing type: 'Board')
     * or an instance of {@link MajorTom} (type: 'MajorTom').
     *
     * @type {string}
     * @access public
     */
    @Column(DataType.STRING)
    public type = AvailableTypes.BOARD;

    /**
     * Boolean stating wether the board is online or not.
     * @type {boolean}
     * @access public
     * @default [false]
     */
    public online = false;

    /**
     * Unique identifier of the physical device's vendor (if available).
     *
     * @type {string}
     * @access public
     */
    public vendorId: string;

    /**
     * Unique identifier of the physical device's model (if available).
     *
     * @type {string}
     * @access public
     */
    public productId: string;

    /**
     * The current program the physical device is running. Defaults to 'IDLE' when it's not doing anything.
     *
     * @access public
     * @type {string}
     * @default ["idle"]
     */
    public currentProgram: string = IDLE;

    /**
     * Last update received by board.
     *
     * @access public
     * @type {string}
     */
    @Column(DataType.STRING)
    public lastUpdateReceived: string;

    /**
     * Local instance of {@link LoggerService}
     *
     * @access protected
     * @type {LoggerService}
     */
    protected log: LoggerService;

    /**
     * This property is used to map available methods to string representations so we can easily
     * validate and call them from elsewhere. The mapping should be obvious.
     * Currently available methods are: BLINKON, BLINKOFF and TOGGLELED.
     *
     * @type {Object}
     * @access protected
     */
    protected availableActions: any = {
        BLINKON: {
            requiresParams: false,
            method: () => {
                this.setBlinkLEDEnabled(true);
            },
        },
        BLINKOFF: {
            requiresParams: false,
            method: () => {
                this.setBlinkLEDEnabled(false);
            },
        },
        TOGGLELED: {
            requiresParams: false,
            method: () => {
                this.toggleLED();
            },
        },
        SETPINVALUE: {
            requiresParams: true,
            method: (pin: string, value: string) => {
                this.setPinValue(parseInt(pin, 10), parseInt(value, 10));
            },
        },
    };

    /**
     * Namespace used by the local instance of {@link LoggerService}
     *
     * @type {string}
     * @access protected
     */
    protected namespace: string;

    /**
     * Local instance of {@link FirmataBoard} that is used to connect and talk to physical devices supporting the firmata protocol.
     *
     * @access protected
     * @type {FirmataBoard}
     */
    protected firmataBoard: FirmataBoard;

    /**
     * An array of intervals stored so we can clear them all at once using {@link Board.clearAllTimeouts} or {@link Board.clearAllTimers} when the moment is there.
     *
     * @access protected
     * @type {Timeout[]}
     * @default [[]]
     */
    protected intervals: Timeout[] = [];

    /**
     * An array of timeouts stored so we can clear them all at once using {@link Board.clearAllTimeouts} or {@link Board.clearAllTimers} when the moment is there.
     *
     * @access protected
     * @type {Timeout[]}
     * @default [[]]
     */
    protected timeouts: Timeout[] = [];

    /**
     * The pinMapping set for generic boards. This is currently set to the pinMapping for Arduino Uno boards.
     *
     * @type {IPinMapping}
     * @default [{ LED: 13, RX: 0, TX: 1 }]
     */
    public architecture = SupportedBoards.ARDUINO_UNO;

    // @Column( DataType.STRING )
    // public pinout: IPinout;

    /**
     * The ID of the interval that's executed when we blink the builtin LED.
     * This is stored to identify whether or not we're already blinking the builtin LED.
     *
     * @access private
     */
    private blinkInterval;

    /**
     * Timeout containing the heartbeat. This is needed to do cleanup work whenever the board is reinstantiated.
     *
     * @access private
     */
    private heartbeatTimeout: Timeout;

    private serialRetry: Timeout;

    /**
     * Array that is used to store the value measured by analog pinMapping for later comparison.
     *
     * @access private
     * @type {number[]}
     * @default [[]]
     */
    private previousAnalogValue: number[] = [];

    public serialConnection = false;

    /**
     * Creates a new instance of Board and awaits a successful connection before starting its heartbeat.
     *
     * @constructor
     * @param {Model} model
     * @param {sequelize.BuildOptions} buildOptions
     * @param {FirmataBoard} firmataBoard
     * @param {string} id
     */
    constructor(
        model?: any,
        buildOptions?: BuildOptions,
        firmataBoard?: FirmataBoard,
        serialConnection: boolean = false,
        id?: string,
    ) {
        super(model, buildOptions);

        this.id = id;
        this.namespace = `board_${this.id}`;
        this.log = new LoggerService(this.namespace);

        if (firmataBoard) {
            this.online = true;
            this.firmataBoard = firmataBoard;
            this.serialConnection = serialConnection;

            if (this.serialConnection) {
                this.firmataBoard.setSamplingInterval(200);
            } else {
                this.firmataBoard.setSamplingInterval(1000);
            }

            this.attachAnalogPinListeners();
            this.attachDigitalPinListeners();
            this.startHeartbeat();
        }
    }

    /**
     * Return an {@link IBoard}.
     *
     * @static
     * @access public
     * @param {Board} board - The {@link Board} instance to convert to an object implementing the {@link IBoard} interface.
     * @returns {IBoard} An object representing a {@link IBoard} instance, but without the overhead and methods.
     */
    public static toDiscrete(board: Board): IBoard {
        if (typeof board !== 'object') {
            throw new TypeError(`Parameter board should be of type object. Received type is ${typeof board}.`);
        }

        let discreteBoard;

        discreteBoard = {
            id: board.id || undefined,
            name: board.name || undefined,
            vendorId: board.vendorId || undefined,
            productId: board.productId || undefined,
            type: board.type || undefined,
            currentProgram: board.currentProgram || undefined,
            online: board.online || undefined,
            serialConnection: board.serialConnection || undefined,
            lastUpdateReceived: board.lastUpdateReceived || undefined,
            architecture: board.architecture || undefined,
            availableCommands: board.getAvailableActions() || undefined,
        };

        if (board.firmataBoard) {
            Object.assign(discreteBoard, {
                refreshRate: board.firmataBoard.getSamplingInterval(),
                pins: board.firmataBoard.pins
                    .map((pin: FirmataBoard.Pins, index: number) =>
                        Object.assign({ pinNumber: index, analog: pin.analogChannel !== 127 }, pin),
                    )
                    .filter((pin: IPin) => pin.supportedModes.length > 0),
            });
        } else {
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
    public static toDiscreteArray(boards: Board[]): IBoard[] {
        if (!Array.isArray(boards)) {
            throw new TypeError(`Parameter boards should be an array. Received type is ${typeof boards}.`);
        }
        if (!boards.length) {
            throw new Error(
                `Parameter boards should contain at least one element. Received array length is ${boards.length}.`,
            );
        }
        return boards.map(Board.toDiscrete);
    }

    protected static is8BitNumber(value: number): boolean {
        if (typeof value !== 'number') {
            return false;
        }
        return value <= 255 && value >= 0;
    }

    /**
     * Method returning a string array containing the actions this device is able to execute.
     *
     * @access public
     * @return {{action: string, requiresParams: boolean}[]} String array containing the available actions.
     */
    public getAvailableActions(): Array<{ name: string; requiresParams: boolean }> {
        const actionNames = Object.keys(this.availableActions);
        return actionNames.map(action => ({
            name: action,
            requiresParams: this.availableActions[action].requiresParams,
        }));
    }

    /**
     * Allows the user to define a different pinMapping for the device than is set by default.
     * Default is defined in {@link Board.pinMapping}
     *
     * @param {IPinMapping} mapping - The pinMapping to save to this board.
     * @returns {void}
     */
    public setArchitecture(architecture: BoardArchitecture): void {
        if (SupportedBoards.isSupported(architecture)) {
            this.architecture = architecture;
        } else {
            throw new Error('This architecture is not supported.');
        }
    }

    /**
     * Sets {@link Board.currentProgram} to 'idle'
     *
     * @access public
     * @returns {void}
     */
    public setIdle(): void {
        this.currentProgram = IDLE;
    }

    /**
     * Return the board's instance of {@link FirmataBoard}
     *
     * @access public
     * @return {FirmataBoard}
     */
    public getFirmataBoard(): FirmataBoard {
        return this.firmataBoard;
    }

    /**
     * Execute an action. Checks if the action is actually available before attempting to execute it.
     *
     * @access public
     * @param {string} action - The action to execute.
     * @param {string[]} [parameters] - The parameters to pass to the action method.
     * @returns {void}
     */
    public executeAction(action: string, parameters?: string[]): void {
        if (!this.online) {
            throw new CommandUnavailableError(`Unable to execute command on this board since it is not online.`);
        }
        if (!this.isAvailableAction(action)) {
            throw new CommandUnavailableError(`'${action}' is not a valid action for this board.`);
        }

        this.log.debug(`Executing method ${Chalk.rgb(67, 230, 145).bold(action)}.`);

        const method = this.availableActions[action].method;

        if (parameters && parameters.length) {
            method(...parameters);
        } else {
            method();
        }

        this.emitUpdate();
    }

    public disconnect(): void {
        this.clearAllTimers();
        this.online = false;
        this.firmataBoard.removeAllListeners();
        this.firmataBoard = undefined;
    }

    /**
     * Clear all timeouts and intervals. This is required when a physical device is online or the Board class reinstantiated.
     *
     * @returns {void}
     */
    public clearAllTimers(): void {
        this.clearAllIntervals();
        this.clearAllTimeouts();
        this.clearListeners();
    }

    public clearListeners(): void {
        this.firmataBoard.pins.forEach((pin: FirmataBoard.Pins, index: number) => {
            if (this.isDigitalPin(index)) {
                this.firmataBoard.removeListener(`digital-read-${index}`, this.emitUpdate);
            }
        });

        this.firmataBoard.analogPins.forEach((pin: number, index: number) => {
            this.firmataBoard.removeListener(`analog-read-${index}`, this.emitUpdate);
        });

        this.firmataBoard.removeListener('queryfirmware', this.clearHeartbeatTimeout);
    }

    /**
     * Clear an interval that was set by this {@link Board} instance.
     *
     * @param {NodeJS.Timeout} interval
     * @returns {void}
     */
    protected clearInterval(interval: Timeout): void {
        if (this.intervals.indexOf(interval) < 0) {
            throw new Error("Interval doesn't exist.");
        }

        this.intervals.splice(this.intervals.indexOf(interval), 1);
        clearInterval(interval);
    }

    /**
     * Clear a timeout that was set by this {@link Board} instance.
     *
     * @param {NodeJS.Timeout} timeout
     * @returns {void}
     */
    protected clearTimeout(timeout: Timeout): void {
        if (this.timeouts.indexOf(timeout) < 0) {
            throw new Error("Timeout doesn't exist.");
        }

        this.timeouts.splice(this.timeouts.indexOf(timeout), 1);
        clearTimeout(timeout);
    }

    /**
     * Enable or disable the builtin LED blinking
     *
     * @param {boolean} enabled
     * @access protected
     * @returns {void}
     */
    protected setBlinkLEDEnabled(enabled: boolean): void {
        if (enabled) {
            if (this.blinkInterval) {
                throw new CommandUnavailableError(`LED blink is already enabled.`);
            }

            this.blinkInterval = setInterval(this.toggleLED, 500);

            this.intervals.push(this.blinkInterval);
        } else {
            this.clearInterval(this.blinkInterval);
            this.blinkInterval = undefined;
        }
    }

    /**
     * Toggle the builtin LED on / off. Turns it on if it's off and vice versa.
     *
     * @access protected
     * @returns {void}
     */
    protected toggleLED = (): void => {
        this.setPinValue(
            this.architecture.pinMap.LED,
            this.firmataBoard.pins[this.architecture.pinMap.LED].value === FirmataBoard.PIN_STATE.HIGH
                ? FirmataBoard.PIN_STATE.LOW
                : FirmataBoard.PIN_STATE.HIGH,
        );
    };

    /**
     * Starts an interval requesting the physical board to send its firmware version every 10 seconds.
     * Emits a 'disconnect' event on the local {@link Board.firmataBoard} instance if the device fails to respond within 2 seconds of this query being sent.
     * The device is deemed online and removed from the data model until it attempts reconnecting after the disconnect event is emitted.
     *
     * @access protected
     * @emits FirmataBoard.disconnect
     * @returns {void}
     */
    protected startHeartbeat(): void {
        const heartbeat = setInterval(() => {
            // set a timeout to emit a disconnect event if the physical device doesn't reply within 2 seconds
            this.heartbeatTimeout = setTimeout(() => {
                this.log.debug(`Heartbeat timeout.`);

                // emit disconnect event after which the board is removed from the data model
                this.firmataBoard.emit('disconnect');
                this.clearInterval(heartbeat);
                this.clearHeartbeatTimeout();
            }, Board.disconnectTimeout);

            this.timeouts.push(this.heartbeatTimeout);

            // we utilize the queryFirmware method to emulate a heartbeat
            this.firmataBoard.queryFirmware(this.clearHeartbeatTimeout);
        }, Board.heartbeatInterval);

        this.intervals.push(heartbeat);
    }

    private clearHeartbeatTimeout = () => {
        this.clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = undefined;
    };

    /**
     * Writes a byte-array with the device's specified serial UART interface.
     *
     * @access private
     * @param {<string | number>[]} payload Array with bytes to send
     * @param {FirmataBoard.SERIAL_PORT_ID} serialPort Serial port on which to send
     * @returns {void}
     */
    protected serialWriteBytes(serialPort: FirmataBoard.SERIAL_PORT_ID, payload: any[]): void {
        const buffer = Buffer.allocUnsafe(payload.length);

        payload.forEach((value: any, index: number) => {
            if (typeof value === 'string') {
                buffer.write(value, index);
            } else if (typeof value === 'number') {
                buffer.writeUInt8(value, index);
            } else {
                throw new TypeError(`Expected string or number. Received ${typeof value}.`);
            }
        });

        const bytesPayload = [];

        for (const [index, value] of buffer.entries()) {
            bytesPayload.push(value);
        }

        // fixme
        // const checkForAck = ( bytes: number[] ) => {
        //     // check if the first (and likely only) byte received is 0x06, which is an ACK
        //     if ( bytes[0] === 6 ) {
        //         console.log(bytes[0]);
        //         clearInterval( this.serialRetry );
        //         this.firmataBoard.removeListener( `serial-data-${this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0}`, checkForAck );
        //     }
        // };
        // this.firmataBoard.serialRead( this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0, -1, checkForAck );

        this.firmataBoard.serialWrite(serialPort, bytesPayload);

        // fixme
        // this.serialRetry = setInterval( () => {
        //     this.firmataBoard.serialWrite( serialPort, bytesPayload );
        // }, 2000);
    }

    /**
     * Emits an 'update' event
     *
     * @emits FirmataBoard.update
     * @returns {void}
     */
    protected emitUpdate = (): void => {
        this.lastUpdateReceived = new Date().toUTCString();
        this.firmataBoard.emit('update', Board.toDiscrete(this));
    };

    /**
     * Write a value to a pin. Automatically distinguishes between analog and digital pinMapping and calls the corresponding methods.
     *
     * @access protected
     * @param {number} pin
     * @param {number} value
     * @returns {void}
     */
    protected setPinValue(pin: number, value: number): void {
        if (!this.firmataBoard.pins[pin]) {
            throw new Error('blargh');
        }

        if (this.isAnalogPin(pin)) {
            if (value < 0 || value >= 1024) {
                throw new CommandMalformed(
                    `Tried to write value ${value} to analog pin ${pin}. Only values between or equal to 0 and 1023 are allowed.`,
                );
            } else {
                this.firmataBoard.analogWrite(pin, value);
            }
        } else {
            if (value !== FirmataBoard.PIN_STATE.HIGH && value !== FirmataBoard.PIN_STATE.LOW) {
                throw new CommandMalformed(
                    `Tried to write value ${value} to digital pin ${pin}. Only values 1 (HIGH) or 0 (LOW) are allowed.`,
                );
            } else {
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
    private attachDigitalPinListeners(): void {
        this.firmataBoard.pins.forEach((pin: FirmataBoard.Pins, index: number) => {
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
    private attachAnalogPinListeners(): void {
        this.firmataBoard.analogPins.forEach((pin: number, index: number) => {
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
    private compareAnalogReadout(pinIndex: number, value: number): void {
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
    private clearAllIntervals(): void {
        clearInterval(this.serialRetry);
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }

    /**
     * Clear all timeouts stored in {@link Board.timeouts}.
     *
     * @access private
     * @returns {void}
     */
    private clearAllTimeouts(): void {
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
    private isAvailableAction(action: string): boolean {
        return this.getAvailableActions().findIndex(_action => _action.name === action) >= 0;
    }

    /**
     * Checks whether a pin is a digital pin.
     *
     * @access private
     * @param {number} pinIndex
     * @returns {boolean}
     */
    private isDigitalPin(pinIndex: number): boolean {
        const pin = this.firmataBoard.pins[pinIndex];
        return (
            pin.analogChannel === 127 &&
            pin.supportedModes.length > 0 &&
            !pin.supportedModes.includes(FirmataBoard.PIN_MODE.ANALOG)
        );
    }

    /**
     * Check whether a pin is an analog pin.
     *
     * @access private
     * @param {number} pinIndex
     * @returns {boolean}
     */
    private isAnalogPin(pinIndex: number): boolean {
        const pin = this.firmataBoard.pins[pinIndex];
        return pin.supportedModes.indexOf(FirmataBoard.PIN_MODE.ANALOG) >= 0;
    }
}

export default Board;

export const IDLE = 'idle';
