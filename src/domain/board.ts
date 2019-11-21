import * as FirmataBoard from 'firmata';
import LoggerService from '../service/logger.service';
import Timeout = NodeJS.Timeout;
import Chalk from 'chalk';
import IBoard from './interface/board';
import IPin from './interface/pin';
import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import BoardArchitecture from './board-architecture';
import { SupportedBoards } from './supported-boards';
import AvailableTypes from './available-types';
import { BadRequest, MethodNotAllowed, NotFound, ValidationError } from '../error/errors';

/**
 * Generic representation of devices compatible with the firmata protocol
 *
 * @namespace Board
 */
@Table({ timestamps: true })
class Board extends Model<Board> implements IBoard {
    constructor(model?: any, buildOptions?: BuildOptions, firmataBoard?: FirmataBoard) {
        super(model, buildOptions);

        this.namespace = `board_${this.id}`;
        this.log = new LoggerService(this.namespace);

        if (firmataBoard) {
            this.firmataBoard = firmataBoard;

            this.firmataBoard.once('queryfirmware', this.parseQueryFirmwareResponse);

            this.attachAnalogPinListeners();
            this.attachDigitalPinListeners();
            this.startHeartbeat();
        }
    }
    /**
     * The interval at which to send out a heartbeat. The heartbeat is used to 'test' the TCP connection with the physical
     * device. If the device doesn't respond within 2 seconds after receiving a heartbeat request, it is deemed online
     * and removed from the data model until it attempts reconnecting.
     */
    private static readonly heartbeatInterval = 10000;
    private static readonly disconnectTimeout = 10000;

    /**
     * The unique identifier by which the board will be known to the outside world. The ID is defined by the filename
     * of the firmware that is flashed to the device. The filename should look like the following example:
     * <generic_name>_<unique_identifier>.ino
     * This is persisted in the database.
     */
    @Column({ type: DataType.STRING, primaryKey: true })
    public id: string;

    /**
     * A custom name, to be given by the user.
     * This is persisted in the database.
     */
    @Column(DataType.STRING)
    public name: string;

    /**
     * String containing the type of device the {@link Board} instance represents. This could be a generic device (thus containing type: 'Board')
     * or an instance of {@link MajorTom} (type: 'MajorTom').
     */
    @Column(DataType.STRING)
    public type = AvailableTypes.BOARD;

    /**
     * Boolean stating whether the board is online or not.
     */
    public online = false;

    /**
     * Unique identifier of the physical device's vendor (if available).
     */
    public vendorId: string;

    /**
     * Unique identifier of the physical device's model (if available).
     */
    public productId: string;

    /**
     * The current program the physical device is running. Defaults to 'IDLE' when it's not doing anything.
     */
    public currentProgram: string = IDLE;

    /**
     * Last update received by board.
     */
    @Column(DataType.STRING)
    public lastUpdateReceived: string;

    /**
     * Local instance of {@link LoggerService}
     */
    protected log: LoggerService;

    /**
     * This property is used to map available methods to string representations so we can easily
     * validate and call them from elsewhere. The mapping should be obvious.
     * Currently available methods are: BLINKON, BLINKOFF and TOGGLELED.
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
     */
    protected namespace: string;

    /**
     * Local instance of {@link FirmataBoard} that is used to connect and talk to physical devices supporting the firmata protocol.
     */
    protected firmataBoard: FirmataBoard;

    /**
     * An array of intervals stored so we can clear them all at once using {@link Board.clearAllTimeouts} or {@link Board.clearAllTimers} when the moment is there.
     */
    protected intervals: Timeout[] = [];

    /**
     * An array of timeouts stored so we can clear them all at once using {@link Board.clearAllTimeouts} or {@link Board.clearAllTimers} when the moment is there.
     */
    protected timeouts: Timeout[] = [];

    /**
     * The pinMapping set for generic boards. This is currently set to the pinMapping for Arduino Uno boards.
     */
    @Column(DataType.JSON)
    public architecture = SupportedBoards.ARDUINO_UNO;

    /**
     * The ID of the interval that's executed when we blink the builtin LED.
     * This is stored to identify whether or not we're already blinking the builtin LED.
     */
    private blinkInterval;

    /**
     * Timeout containing the heartbeat. This is needed to do cleanup work whenever the board is reinstantiated.
     */
    private heartbeatTimeout: Timeout;

    private serialRetry: Timeout;

    /**
     * Array that is used to store the value measured by analog pinMapping for later comparison.
     */
    private previousAnalogValue: number[] = [];

    /**
     * Return an {@link IBoard}.
     */
    public static toDiscrete(board: Board): IBoard {
        let discreteBoard;

        discreteBoard = {
            id: board.id,
            name: board.name || undefined,
            vendorId: board.vendorId || undefined,
            productId: board.productId || undefined,
            type: board.type,
            currentProgram: board.currentProgram,
            online: board.online,
            lastUpdateReceived: board.lastUpdateReceived || undefined,
            architecture: board.architecture,
            availableCommands: board.getAvailableActions(),
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
     */
    public static toDiscreteArray(boards: Board[]): IBoard[] {
        if (!boards.length) {
            throw new ValidationError(
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

    private static parseBoardType(firmataBoard: FirmataBoard): string {
        let type = firmataBoard.firmware.name.split('_').shift();

        if (!type || type.indexOf('.') >= 0) {
            type = AvailableTypes.BOARD;
        }

        return type;
    }

    private static parseBoardId(firmataBoard: FirmataBoard): string {
        // todo: handle exception flows
        return firmataBoard.firmware.name
            .split('_')
            .pop()
            .replace('.ino', '');
    }

    /**
     * Method returning a string array containing the actions this device is able to execute.
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
     */
    public setArchitecture(architecture: BoardArchitecture): void {
        if (SupportedBoards.isSupported(architecture)) {
            this.architecture = architecture;
        } else {
            throw new BadRequest('This architecture is not supported.');
        }
    }

    /**
     * Sets {@link Board.currentProgram} to 'idle'
     */
    public setIdle(): void {
        this.currentProgram = IDLE;
    }

    /**
     * Return the board's instance of {@link FirmataBoard}
     */
    public getFirmataBoard(): FirmataBoard {
        return this.firmataBoard;
    }

    /**
     * Execute an action. Checks if the action is actually available before attempting to execute it.
     */
    public executeAction(action: string, parameters?: string[]): void {
        if (!this.online) {
            throw new MethodNotAllowed(`Unable to execute command on this board since it is not online.`);
        }
        if (!this.isAvailableAction(action)) {
            throw new NotFound(`'${action}' is not a valid action for this board.`);
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
     */
    protected clearInterval(interval: Timeout): void {
        this.intervals.splice(this.intervals.indexOf(interval), 1);
        clearInterval(interval);
    }

    /**
     * Clear a timeout that was set by this {@link Board} instance.
     */
    protected clearTimeout(timeout: Timeout): void {
        this.timeouts.splice(this.timeouts.indexOf(timeout), 1);
        clearTimeout(timeout);
    }

    /**
     * Enable or disable the builtin LED blinking
     */
    protected setBlinkLEDEnabled(enabled: boolean): void {
        if (enabled) {
            if (this.blinkInterval) {
                throw new MethodNotAllowed(`LED blink is already enabled.`);
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
     */
    protected serialWriteBytes(serialPort: FirmataBoard.SERIAL_PORT_ID, payload: any[]): void {
        const buffer = Buffer.allocUnsafe(payload.length);

        payload.forEach((value: any, index: number) => {
            if (typeof value === 'string') {
                buffer.write(value, index);
            } else if (typeof value === 'number') {
                buffer.writeUInt8(value, index);
            } else {
                throw new ValidationError(`Expected string or number. Received ${typeof value}.`);
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
     */
    protected emitUpdate = (): void => {
        this.lastUpdateReceived = new Date().toUTCString();
        this.firmataBoard.emit('update', Board.toDiscrete(this));
    };

    /**
     * Write a value to a pin. Automatically distinguishes between analog and digital pinMapping and calls the corresponding methods.
     */
    protected setPinValue(pin: number, value: number): void {
        if (!this.firmataBoard.pins[pin]) {
            throw new NotFound(`Attempted to set value of unknown pin ${pin}.`);
        }

        if (this.isAnalogPin(pin)) {
            if (value < 0 || value >= 1024) {
                throw new BadRequest(
                    `Attempted to write value ${value} to analog pin ${pin}. Only values between or equal to 0 and 1023 are allowed.`,
                );
            } else {
                this.firmataBoard.analogWrite(pin, value);
            }
        } else {
            if (value !== FirmataBoard.PIN_STATE.HIGH && value !== FirmataBoard.PIN_STATE.LOW) {
                throw new BadRequest(
                    `Attempted to write value ${value} to digital pin ${pin}. Only values 1 (HIGH) or 0 (LOW) are allowed.`,
                );
            } else {
                this.firmataBoard.digitalWrite(pin, value);
            }
        }

        this.emitUpdate();
    }

    private parseQueryFirmwareResponse = (): void => {
        this.id = Board.parseBoardId(this.firmataBoard);
        this.type = Board.parseBoardType(this.firmataBoard);
        this.online = true;
    };

    setIsSerialConnection(isSerial: boolean): void {
        if (isSerial) {
            this.firmataBoard.setSamplingInterval(200);
        } else {
            this.firmataBoard.setSamplingInterval(1000);
        }
    }

    /**
     * Attaches listeners to all digital pinMapping whose modes ({@link FirmataBoard.PIN_MODE}) are setup as INPUT pinMapping.
     * Once the pin's value changes an 'update' event will be emitted by calling the {@link Board.emitUpdate} method.
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
     */
    private attachAnalogPinListeners(): void {
        this.firmataBoard.analogPins.forEach((pin: number, index: number) => {
            this.firmataBoard.analogRead(index, this.emitUpdate);
        });
    }

    /**
     * Calls {@link Board.emitUpdate} if the current value differs from the previously measured value.
     */
    private compareAnalogReadout(pinIndex: number, value: number): void {
        if (this.previousAnalogValue[pinIndex] !== value) {
            this.previousAnalogValue[pinIndex] = value;
            this.emitUpdate();
        }
    }

    /**
     * Clear all intervals stored in {@link Board.intervals}.
     */
    private clearAllIntervals(): void {
        clearInterval(this.serialRetry);
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }

    /**
     * Clear all timeouts stored in {@link Board.timeouts}.
     */
    private clearAllTimeouts(): void {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts = [];
    }

    /**
     * Check if the action received is valid from the list of {@link Board.availableActions}.
     */
    private isAvailableAction(action: string): boolean {
        return this.getAvailableActions().findIndex(_action => _action.name === action) >= 0;
    }

    /**
     * Checks whether a pin is a digital pin.
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
     */
    private isAnalogPin(pinIndex: number): boolean {
        const pin = this.firmataBoard.pins[pinIndex];
        return pin.supportedModes.indexOf(FirmataBoard.PIN_MODE.ANALOG) >= 0;
    }
}

export default Board;

export const IDLE = 'idle';
