import Board, {IDLE} from '../domain/board';
import {Sequelize} from 'sequelize-typescript';
import CommandUnavailableError from "../error/command-unavailable";
import FirmataBoardMock from "./mocks/firmata-board.mock";
import * as FirmataBoard from 'firmata';
import {SupportedBoards} from "../domain/supported-boards";
import CommandMalformed from "../error/command-malformed";

let board: any;
let sequelize: Sequelize;

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([
        Board,
    ]);
});

beforeEach(() => {
    // @ts-ignore
    Board.heartbeatInterval = 1000;
    // @ts-ignore
    Board.disconnectTimeout = 1000;
    board = new Board(undefined, undefined, undefined, undefined, 'bacon');
});

describe('Board:', () => {
    test('is instantiated', () => {
        expect(board).toBeDefined();
    });

    test('is instantiated with firmataBoard', () => {
        // @ts-ignore
        const firmataBoardMock = new FirmataBoardMock() as FirmataBoard;
        board = new Board(undefined, undefined, firmataBoardMock , undefined, 'bacon' );

        expect(board).toBeDefined();
    });

    test('is instantiated with firmataBoard and serial connection', () => {
        // @ts-ignore
        const firmataBoardMock = new FirmataBoardMock() as FirmataBoard;
        board = new Board(undefined, undefined, firmataBoardMock , true, 'bacon' );

        expect(board).toBeDefined();
    });

    test('.getAvailableActions() returns correct available actions', () => {
        const availableActions = board.getAvailableActions();

        expect(availableActions).toBeDefined();
        expect(Array.isArray(availableActions)).toBeTruthy();
        expect(availableActions[0].name).toBe('BLINKON');
        expect(availableActions[1].name).toBe('BLINKOFF');
        expect(availableActions[2].name).toBe('TOGGLELED');
        expect(availableActions[3].name).toBe('SETPINVALUE');
        expect(availableActions[0].requiresParams).toBeFalsy();
        expect(availableActions[1].requiresParams).toBeFalsy();
        expect(availableActions[2].requiresParams).toBeFalsy();
        expect(availableActions[3].requiresParams).toBeTruthy();
    });

    test('.setArchitecture() sets board architecture to ESP8266', () => {
        board.setArchitecture(SupportedBoards.ESP_8266);

        expect(board.architecture.pinMap.LED).toEqual(2);
        expect(board.architecture.pinMap.RX).toEqual(3);
        expect(board.architecture.pinMap.TX).toEqual(1);
    });

    test('.setArchitecture() sets board architecture to Arduino Uno', () => {
        board.setArchitecture(SupportedBoards.ARDUINO_UNO);

        expect(board.architecture.pinMap.LED).toEqual(13);
        expect(board.architecture.pinMap.RX).toEqual(1);
        expect(board.architecture.pinMap.TX).toEqual(0);
    });

    test('.setArchitecture() throws an error when setting unsupported architecture', () => {
        const badPinout = () => {
            board.setArchitecture('bacon');
        };

        expect(badPinout).toThrowError(new Error( 'This architecture is not supported.' ));
    });

    test('.setIdle() sets current program to IDLE', () => {
        board.setIdle();

        expect(board.currentProgram).toBe(IDLE);
    });

    test('.getFirmataBoard() returns undefined firmataboard object', () => {
        const firmataBoard = board.getFirmataBoard();

        expect(firmataBoard).toBeUndefined();
    });

    test('.getFirmataBoard() returns mock firmataboard object', () => {
        board.firmataBoard = new FirmataBoardMock();
        const firmataBoard = board.getFirmataBoard();

        expect(firmataBoard).toBeDefined();
    });

    test('.toDiscrete() returns object with pins property', () => {
        board.firmataBoard = new FirmataBoardMock();
        const discreteBoard = Board.toDiscrete(board);

        expect(discreteBoard).toBeDefined();
        expect(discreteBoard.online).toBeFalsy();
        expect(discreteBoard.pins).toBeDefined();
        expect(discreteBoard.architecture).toBeDefined();
        expect(Array.isArray(discreteBoard.pins)).toBeTruthy();
        expect(discreteBoard.pins.length).toEqual(2);
        expect(discreteBoard.id).toEqual('bacon');
        expect(discreteBoard.serialConnection).toBeFalsy();
        expect(discreteBoard.lastUpdateReceived).toBeUndefined();
        expect(Array.isArray(discreteBoard.availableCommands)).toBeTruthy();
        expect(Array.isArray(discreteBoard.pins)).toBeTruthy();
    });

    test('.toDiscrete() returns object without pins property', () => {
        const discreteBoard = Board.toDiscrete(board);

        expect(discreteBoard).toBeDefined();
        expect(discreteBoard.online).toBeFalsy();
        expect(discreteBoard.architecture).toBeDefined();
        expect(discreteBoard.pins.length).toEqual(0);
        expect(discreteBoard.id).toEqual('bacon');
        expect(discreteBoard.serialConnection).toBeFalsy();
        expect(discreteBoard.lastUpdateReceived).toBeUndefined();
        expect(Array.isArray(discreteBoard.availableCommands)).toBeTruthy();
        expect(Array.isArray(discreteBoard.pins)).toBeTruthy();
    });

    test('.toDiscreteArray() returns array of objects reflecting IBoard interface', () => {
        const discreteBoardArray = Board.toDiscreteArray([board]);

        expect(Array.isArray(discreteBoardArray)).toBeTruthy();
    });

    // offline board should throw error when running executeAction method
    test('.executeAction() should throw error when board not online', () => {
        const executeAction = () => {
            board.executeAction('TOGGLELED');
        };

        expect(executeAction).toThrowError(new CommandUnavailableError( `Unable to execute command on this board since it is not online.` ));
    });

    // unavailable method should throw error when running executeAction method
    test('.executeAction() should throw error when action not valid', () => {
        const executeAction = () => {
            board.executeAction('bacon');
        };

        board.online = true;

        expect(executeAction).toThrowError(new CommandUnavailableError( `'bacon' is not a valid action for this board.` ));
    });

    test('.executeAction() should run TOGGLELED method and emit update', () => {
        const action = 'TOGGLELED';
        board.online = true;
        board.toggleLED = jest.fn();
        board.firmataBoard = new FirmataBoardMock();

        board.executeAction(action);

        expect(board.toggleLED).toHaveBeenCalled();
        expect(board.firmataBoard.emit).toHaveBeenCalled();
    });

    test('.executeAction() should run .setBlinkLEDEnabled(true) method and emit update', () => {
        const action = 'BLINKON';
        board.online = true;
        board.setBlinkLEDEnabled = jest.fn();
        board.firmataBoard = new FirmataBoardMock();

        board.executeAction(action);

        expect(board.setBlinkLEDEnabled).toHaveBeenCalled();
        expect(board.firmataBoard.emit).toHaveBeenCalled();
    });

    test('.executeAction() should run .setBlinkLEDEnabled(false) method and emit update', () => {
        const action = 'BLINKOFF';
        board.online = true;
        board.setBlinkLEDEnabled = jest.fn();
        board.firmataBoard = new FirmataBoardMock();

        board.executeAction(action);

        expect(board.setBlinkLEDEnabled).toHaveBeenCalled();
        expect(board.firmataBoard.emit).toHaveBeenCalled();
    });

    test('.executeAction() should run action method with parameters and emit update when given correct action', () => {
        const action = 'SETPINVALUE';
        const parameters = [ 0, 128 ];
        board.online = true;
        board.setPinValue = jest.fn();
        board.firmataBoard = new FirmataBoardMock();

        board.executeAction(action, parameters);

        expect(board.setPinValue).toHaveBeenCalled();
        expect(board.firmataBoard.emit).toHaveBeenCalled();
    });

    test('.disconnect() should disconnect the board and clear listeners', () => {
        board.online = true;
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;
        board.clearAllTimers = jest.fn();

        board.disconnect();

        expect(mockFirmataBoard.removeAllListeners).toHaveBeenCalled();
        expect(board.clearAllTimers).toHaveBeenCalled();
        expect(board.online).toBeFalsy();
        expect(board.firmataBoard).toBeFalsy();
    });

    test('.clearAllTimers() should clear all timers and intervals', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;
        board.clearAllIntervals = jest.fn();
        board.clearAllTimeouts = jest.fn();
        board.clearListeners = jest.fn();

        board.clearAllTimers();

        expect(board.clearAllIntervals).toHaveBeenCalled();
        expect(board.clearAllTimeouts).toHaveBeenCalled();
        expect(board.clearListeners).toHaveBeenCalled();
    });

    test('.clearListeners() should remove all listeners from pins and firmataBoard', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.clearListeners();

        expect(mockFirmataBoard.removeListener.mock.calls[0][0]).toEqual('digital-read-1');
        expect(mockFirmataBoard.removeListener.mock.calls[1][0]).toEqual('analog-read-0');
        expect(mockFirmataBoard.removeListener.mock.calls[2][0]).toEqual('queryfirmware');
        expect(mockFirmataBoard.removeListener).toHaveBeenCalledTimes(3);
    });

    test('.clearInterval() should clear the supplied interval', () => {
        const interval = setInterval(jest.fn(), 1000);
        board.intervals = [interval];

        board.clearInterval(interval);

        expect(board.intervals.length).toEqual(0);
    });

    test('.clearTimeout() should clear the supplied timeout', () => {
        const timeout = setTimeout(jest.fn(), 1000);
        board.timeouts = [timeout];

        board.clearTimeout(timeout);

        expect(board.timeouts.length).toEqual(0);
    });

    test('.setBlinkLEDEnabled() should blink the LED', (done) => {
        board.toggleLED = jest.fn();

        board.setBlinkLEDEnabled(true);

        expect(board.blinkInterval).toBeDefined();
        expect(board.intervals.length).toEqual(1);

        // wait for the interval to call the toggleLED method
        setTimeout(() => {
            expect(board.toggleLED).toHaveBeenCalled();
            done();
        }, 1000);
    });

    test('.setBlinkLEDEnabled() should throw an error when already blinking the LED', () => {
        board.toggleLED = jest.fn();
        board.blinkInterval = 1;

        const blinkLed = () => {
            board.setBlinkLEDEnabled(true);
        };

        expect(blinkLed).toThrowError(new CommandUnavailableError( `LED blink is already enabled.` ));
    });

    test('.setBlinkLEDEnabled() should stop blinking the LED', () => {
        board.toggleLED = jest.fn();
        board.setBlinkLEDEnabled(true);

        board.setBlinkLEDEnabled(false);

        expect(board.blinkInterval).toBeUndefined();
        expect(board.intervals.length).toEqual(0);
    });

    test('.toggleLED() sets the value of the LED pin to HIGH when initial value is LOW', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.architecture.pinMap.LED = 1;
        board.setPinValue = jest.fn();

        board.toggleLED();

        expect(board.setPinValue).toHaveBeenCalledWith( board.architecture.pinMap.LED, FirmataBoard.PIN_STATE.HIGH );
    });

    test('.toggleLED() sets the value of the LED pin to LOW when initial value is HIGH', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;
        board.firmataBoard.pins[1].value = 1;

        board.architecture.pinMap.LED = 1;
        board.setPinValue = jest.fn();

        board.toggleLED();

        expect(board.setPinValue).toHaveBeenCalledWith( board.architecture.pinMap.LED, FirmataBoard.PIN_STATE.LOW );
    });

    test('.startHeartbeat() sets a heartbeat interval', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.startHeartbeat();

        expect(board.intervals.length).toEqual(1);
    });

    test('.startHeartbeat() sets a heartbeat timeout', (done) => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.startHeartbeat();

        setTimeout(() => {
            expect(board.heartbeatTimeout).toBeDefined();
            done();
        }, 1100);
    });

    test('heartbeat doesn\'t timeout if the board replies on time', (done) => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.startHeartbeat();

        setTimeout(() => {
            expect(board.intervals.length).toEqual(1);
            expect(board.firmataBoard.queryFirmware).toHaveBeenCalledTimes(2);
            done();
        }, 3000);
    });

    test('connection times out if no response is received within 10 seconds', (done) => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;
        board.firmataBoard.queryFirmware = jest.fn( callback => setTimeout( callback, 2500 ));

        board.startHeartbeat();

        setTimeout(() => {
            expect(board.heartbeatTimeout).toBeUndefined();
            expect(board.timeouts.length).toEqual(0);
            expect(board.intervals.length).toEqual(0);
            expect(board.firmataBoard.emit).toHaveBeenCalledWith('disconnect');
            done();
        }, 3000);
    });

    test('.clearHeartbeatTimeout() clears the heartbeat timeout', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;
        board.heartbeatTimeout = setTimeout(() => {});
        board.timeouts.push(board.heartbeatTimeout);

        board.clearHeartbeatTimeout();

        expect(board.heartbeatTimeout).toBeUndefined();
        expect(board.timeouts.length).toEqual(0);
    });

    // fixme this fails if I use bytes, why? numbers should also be converted to bytes, shouldn't they? Returned value is [1, 3, 3, 7]
    test('.serialWriteBytes() writes an array of numbers converted to bytes to a serial port', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.serialWriteBytes(FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, [ 'h', 1, 3, 3, 7 ]);

        expect(board.firmataBoard.serialWrite).toHaveBeenCalledWith( FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, [ 104, 1, 3, 3, 7 ] );
    });

    test('.serialWriteBytes() writes an array of characters converted to bytes to a serial port', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.serialWriteBytes(FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, ['h', 'e', 'l', 'l', 'o']);

        expect(board.firmataBoard.serialWrite).toHaveBeenCalledWith( FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, [ 104, 101, 108, 108, 111 ] );
    });

    test('.emitUpdate() emits an update event containing a discrete copy of the board instance', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.emitUpdate();

        expect(board.firmataBoard.emit).toHaveBeenCalledWith( 'update', Board.toDiscrete(board) )
    });

    test('.setPinValue() throws an error if no pin is supplied', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const value = 1;
        const pin = undefined;
        board.firmataBoard = mockFirmataBoard;

        const setPinValue = () => {
            board.setPinValue(pin, value);
        };

        expect( setPinValue ).toThrowError( new CommandMalformed( `Method setPinValue requires 'pin' argument.` ) );
    });

    test('.setPinValue() throws an error if no value is supplied', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const value = undefined;
        const pin = 1;
        board.firmataBoard = mockFirmataBoard;

        const setPinValue = () => {
            board.setPinValue(pin, value);
        };

        expect( setPinValue ).toThrowError( new CommandMalformed( `Method setPinValue requires 'value' argument.` ) );
    });

    test('.setPinValue() throws an error if an invalid value is supplied for an analog pin', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        let value = -20;
        const pin = 0;
        board.firmataBoard = mockFirmataBoard;

        const setPinValue = () => {
            board.setPinValue(pin, value);
        };

        expect( setPinValue ).toThrowError( new CommandMalformed( `Tried to write value ${ value } to analog pin ${ pin }. Only values between or equal to 0 and 1023 are allowed.` ) );

        value = 2000;

        expect( setPinValue ).toThrowError( new CommandMalformed( `Tried to write value ${ value } to analog pin ${ pin }. Only values between or equal to 0 and 1023 are allowed.` ) );
    });

    test('.setPinValue() throws an error if a non-binary value is supplied while setting a digital pin', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const value = 2;
        const pin = 1;
        board.firmataBoard = mockFirmataBoard;

        const setPinValue = () => {
            board.setPinValue(pin, value);
        };

        expect( setPinValue ).toThrowError( new CommandMalformed( `Tried to write value ${ value } to digital pin ${ pin }. Only values 1 (HIGH) or 0 (LOW) are allowed.` ) );
    });

    test('.setPinValue() calls .analogWrite() method when supplied with an analog pin', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const value = 128;
        const pin = 0;
        board.firmataBoard = mockFirmataBoard;
        board.emitUpdate = jest.fn();

        board.setPinValue(pin, value);

        expect( board.firmataBoard.analogWrite ).toHaveBeenCalledWith( pin, value );
        expect(board.emitUpdate).toHaveBeenCalled();
    });

    test('.setPinValue() calls .digitalWrite() method when supplied with a digital pin', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const value = 1;
        const pin = 1;
        board.firmataBoard = mockFirmataBoard;
        board.emitUpdate = jest.fn();

        board.setPinValue(pin, value);

        expect( board.firmataBoard.digitalWrite ).toHaveBeenCalledWith( pin, value );
        expect(board.emitUpdate).toHaveBeenCalled();
    });

    test('.attachDigitalPinListeners() attaches listeners to all digital pins', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const pin = 1;
        board.firmataBoard = mockFirmataBoard;

        board.attachDigitalPinListeners();

        expect(board.firmataBoard.digitalRead).toHaveBeenCalledTimes(1);
        expect(board.firmataBoard.digitalRead).toHaveBeenCalledWith( pin, board.emitUpdate);
    });

    test('.attachAnalogPinListeners() attaches listeners to all analog pins', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const pin = 0;
        board.firmataBoard = mockFirmataBoard;

        board.attachAnalogPinListeners();

        expect(board.firmataBoard.analogRead).toHaveBeenCalledTimes(1);
        expect(board.firmataBoard.analogRead).toHaveBeenCalledWith( pin, board.emitUpdate);
    });

    test('.compareAnalogReadout() updates the previous analog value', () => {
        board.emitUpdate = jest.fn();
        const pin = 0;
        const value = 700;

        board.compareAnalogReadout(pin, value);

        expect(board.previousAnalogValue[pin]).toEqual(value);
        expect(board.emitUpdate).toHaveBeenCalledTimes(1);
    });

    test('.compareAnalogReadout() retains the previous analog value', () => {
        board.emitUpdate = jest.fn();
        const pin = 0;
        const value = 512;

        board.compareAnalogReadout(pin, value);
        board.compareAnalogReadout(pin, value);

        expect(board.previousAnalogValue[pin]).toEqual(value);
        expect(board.emitUpdate).toHaveBeenCalledTimes(1);
    });

    test('.clearAllIntervals() clears all intervals', () => {
        board.intervals.push(setInterval(() => {}, 1000));
        board.clearAllIntervals();

        expect(board.intervals.length).toEqual(0);
    });

    test('.clearAllTimeouts() clears all timeouts', () => {
        board.timeouts.push(setTimeout(() => {}, 1000));
        board.clearAllTimeouts();

        expect(board.timeouts.length).toEqual(0);
    });

    test('.isAvailableAction() returns true if action is available', () => {
        expect(board.isAvailableAction('TOGGLELED')).toEqual(true);
    });

    test('.isAvailableAction() returns false if action is not available', () => {
        expect(board.isAvailableAction('bacon')).toEqual(false);
    });

    test('.isDigitalPin() returns true when a digital pin\'s index is passed in', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const pinIndex = 1;
        board.firmataBoard = mockFirmataBoard;


        expect(board.isDigitalPin(pinIndex)).toEqual(true);
    });

    test('.isDigitalPin() returns false when an analog pin\'s index is passed in', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const pinIndex = 0;
        board.firmataBoard = mockFirmataBoard;


        expect(board.isDigitalPin(pinIndex)).toEqual(false);
    });

    test('.isAnalogPin() returns true when an analog pin\'s index is passed in', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const pinIndex = 0;
        board.firmataBoard = mockFirmataBoard;


        expect(board.isAnalogPin(pinIndex)).toEqual(true);
    });

    test('.isAnalogPin() returns false when an digital pin\'s index is passed in', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        const pinIndex = 1;
        board.firmataBoard = mockFirmataBoard;


        expect(board.isAnalogPin(pinIndex)).toEqual(false);
    });
});