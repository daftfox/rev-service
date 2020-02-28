import { BuildOptions } from 'sequelize';
import { LoggerService } from '../../../service/logger.service';
import Timeout = NodeJS.Timeout;
import { BoardArchitecture, SUPPORTED_ARCHITECTURES } from './board-architecture.model';
import { IBoard, IPin } from '../interface';
import { Column, DataType, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import {
    ArchitectureUnsupportedError,
    BoardIncompatibleError,
    BoardPinNotFoundError,
    BoardUnavailableError,
    InvalidArgumentError,
} from '../../error';
import { injectable } from 'tsyringe';
import { IBoardDataValues } from '../interface/board-data-values.interface';
import { FirmataBoard, Pins, SERIAL_PORT_ID } from './firmata-board.model';

/**
 * Generic representation of devices compatible with the firmata protocol
 *
 * @namespace Board
 */
@injectable()
@Table({ timestamps: true })
export class Board extends Model<Board> implements IBoard {
    constructor(model?: any, buildOptions?: BuildOptions) {
        super(model, buildOptions);
        this.namespace = `board-${this.id}`;
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

    @PrimaryKey
    @Unique
    @Column
    public id: string;

    /**
     * A custom name, to be given by the user.
     * This is persisted in the database.
     */
    @Column
    public name: string;

    /**
     * String containing the type of device the {@link Board} instance represents. This could be a generic device (thus containing type: 'Board')
     * or an instance of {@link MajorTom} (type: 'MajorTom').
     */
    @Column
    public type: string = this.constructor.name;

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
    @Column
    public lastUpdateReceived: string;

    /**
     * This property is used to map available methods to string representations so we can easily
     * validate and call them from elsewhere. The mapping should be obvious.
     * Currently available methods are: BLINKON, BLINKOFF and TOGGLELED.
     */
    public availableActions: any = {
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
    public architecture: BoardArchitecture = SUPPORTED_ARCHITECTURES.ARDUINO_UNO;

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
     * Return an array of {@link IBoard}.
     */
    public static toDiscreteArray(boards: Board[]): IBoard[] {
        return boards.map((board: Board) => board.toDiscrete());
    }

    protected static is8BitNumber(value: number): boolean {
        if (typeof value !== 'number') {
            return false;
        }
        return value <= 255 && value >= 0;
    }

    /**
     * Return an {@link IBoard}.
     */
    public toDiscrete(): IBoard {
        let discreteBoard;

        discreteBoard = {
            id: this.id,
            name: this.name || 'No name',
            vendorId: this.vendorId,
            productId: this.productId,
            type: this.type,
            currentProgram: this.currentProgram,
            online: this.online,
            lastUpdateReceived: this.lastUpdateReceived,
            architecture: this.architecture,
            availableActions: this.getAvailableActions(),
        };

        if (this.firmataBoard) {
            Object.assign(discreteBoard, {
                refreshRate: this.firmataBoard.getSamplingInterval(),
                pins: this.firmataBoard.pins
                    .map((pin: Pins, index: number) =>
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

    public attachFirmataBoard(firmataBoard: FirmataBoard): void {
        this.firmataBoard = firmataBoard;

        this.firmataBoard.firmwareUpdated.attach(this.setBoardOnline);

        this.attachAnalogPinListeners();
        this.attachDigitalPinListeners();
        this.startHeartbeat();
    }

    /**
     * Method returning a string array containing the actions this device is able to execute.
     */
    public getAvailableActions(): { name: string; requiresParams: boolean }[] {
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
        if (BoardArchitecture.isSupported(architecture)) {
            this.architecture = architecture;
        } else {
            throw new ArchitectureUnsupportedError('This architecture is not supported.');
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
            throw new BoardUnavailableError(`Unable to execute action on this board since it is not online.`);
        }
        if (!this.isAvailableAction(action)) {
            throw new BoardIncompatibleError(`'${action}' is not a valid action for this board.`);
        }

        LoggerService.debug(`Executing method ${LoggerService.highlight(action, 'green', true)}.`, this.namespace);

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

    public getDataValues(): IBoardDataValues {
        return {
            id: this.id || undefined,
            name: this.name,
            type: this.type,
            lastUpdateReceived: this.lastUpdateReceived,
            architecture: this.architecture,
        };
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
        this.firmataBoard.pins.forEach((pin: Pins, index: number) => {
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
                throw new BoardUnavailableError(`LED blink is already enabled.`);
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
     * Emits a 'disconnect' event on the local {@link Board.firmataBoard} instance if the device fails to respond within 10 seconds of this query being sent.
     */
    protected startHeartbeat(): void {
        const heartbeat = setInterval(() => {
            // set a timeout to emit a disconnect event if the physical device doesn't reply within 2 seconds
            this.heartbeatTimeout = setTimeout(() => {
                LoggerService.debug(`Heartbeat timeout.`, this.namespace);

                // emit disconnect event after which the board is removed from the data model
                this.firmataBoard.disconnect.post();
                this.clearInterval(heartbeat);
                this.clearHeartbeatTimeout();
            }, Board.disconnectTimeout);

            this.timeouts.push(this.heartbeatTimeout);

            // we utilize the queryFirmware method to emulate a heartbeat
            // this method executes the supplied callback method to indicate
            // it has received a reply from the physical board
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
    protected serialWriteBytes(serialPort: SERIAL_PORT_ID, payload: any[]): void {
        const buffer = Buffer.allocUnsafe(payload.length);

        payload.forEach((value: any, index: number) => {
            if (typeof value === 'string') {
                buffer.write(value, index);
            } else if (typeof value === 'number') {
                buffer.writeUInt8(value, index);
            } else {
                throw new InvalidArgumentError(`Expected string or number. Received ${typeof value}.`);
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
        this.firmataBoard.update.post(this.toDiscrete());
    };

    /**
     * Write a value to a pin. Automatically distinguishes between analog and digital pinMapping and calls the corresponding methods.
     */
    protected setPinValue(pin: number, value: number): void {
        if (!this.firmataBoard.pins[pin]) {
            throw new BoardPinNotFoundError(`Attempted to set value of unknown pin ${pin}.`);
        }

        if (this.isAnalogPin(pin)) {
            if (value < 0 || value >= 1024) {
                throw new InvalidArgumentError(
                    `Attempted to write value ${value} to analog pin ${pin}. Only values between or equal to 0 and 1023 are allowed.`,
                );
            } else {
                this.firmataBoard.analogWrite(pin, value);
            }
        } else {
            if (value !== FirmataBoard.PIN_STATE.HIGH && value !== FirmataBoard.PIN_STATE.LOW) {
                throw new InvalidArgumentError(
                    `Attempted to write value ${value} to digital pin ${pin}. Only values 1 (HIGH) or 0 (LOW) are allowed.`,
                );
            } else {
                this.firmataBoard.digitalWrite(pin, value);
            }
        }

        this.emitUpdate();
    }

    private setBoardOnline = (): void => {
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
        this.firmataBoard.pins.forEach((pin: Pins, index: number) => {
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

export const IDLE = 'idle';
