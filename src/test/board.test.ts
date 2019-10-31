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
    board = new Board(undefined, undefined, undefined, undefined, 'bacon');
    const mockFirmataBoard = new FirmataBoardMock();
    board.firmataBoard = mockFirmataBoard;
});

// todo: separate happy and fail flow tests
describe('Board', () => {
    describe('constructor', () => {
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
    });

    describe('getAvailableActions', () => {
        test('should return correct available actions', () => {
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
    });

    describe('setArchitecture', () => {
        describe('happy flows', () => {
            test('should set board architecture to ESP8266', () => {
                board.setArchitecture(SupportedBoards.ESP_8266);

                expect(board.architecture.pinMap.LED).toEqual(2);
                expect(board.architecture.pinMap.RX).toEqual(3);
                expect(board.architecture.pinMap.TX).toEqual(1);
            });

            test('should set board architecture to Arduino Uno', () => {
                board.setArchitecture(SupportedBoards.ARDUINO_UNO);

                expect(board.architecture.pinMap.LED).toEqual(13);
                expect(board.architecture.pinMap.RX).toEqual(1);
                expect(board.architecture.pinMap.TX).toEqual(0);
            });
        });

        describe('exception flows', () => {
            test('should throw an error when setting unsupported architecture', () => {
                const badPinout = () => {
                    board.setArchitecture('bacon');
                };

                expect(badPinout).toThrowError(new Error( 'This architecture is not supported.' ));
            });
        });
    });

    describe('setIdle', () => {
        test('should set current program to IDLE', () => {
            board.setIdle();

            expect(board.currentProgram).toBe(IDLE);
        });
    });

    describe('getFirmataBoard', () => {
        test('should return undefined firmataboard object', () => {
            board = new Board();
            const firmataBoard = board.getFirmataBoard();

            expect(firmataBoard).toBeUndefined();
        });

        test('should return mock firmataboard object', () => {
            const firmataBoard = board.getFirmataBoard();

            expect(firmataBoard).toBeDefined();
        });
    });

    describe('toDiscrete', () => {
        describe('happy flows', () => {
            test('should return object with all the required properties', () => {
                const discreteBoard = Board.toDiscrete(board);

                const requiredProperties = [
                    'id',
                    'name',
                    'vendorId',
                    'productId',
                    'type',
                    'currentProgram',
                    'online',
                    'serialConnection',
                    'lastUpdateReceived',
                    'architecture',
                    'availableCommands',
                    'pins',

                    // optional. only when supplied board parameter has firmataBoard property
                    'refreshRate',
                ];

                expect(discreteBoard).toBeDefined();

                requiredProperties.forEach(property => {
                    expect(property in discreteBoard).toEqual( true );
                } );
            });

            test('should return object without refreshRate property', () => {
                board.firmataBoard = undefined;
                const discreteBoard = Board.toDiscrete(board);

                expect(discreteBoard).toBeDefined();
                expect('refreshRate' in discreteBoard).toEqual(false);
            });
        });

        describe('exception flows', () => {
            test.each(
                [
                    ['bacon', new TypeError('Parameter board should be of type object. Received type is string.')],
                    [1337, new TypeError('Parameter board should be of type object. Received type is number.')],
                ],
            )('should throw TypeError', (board: any, error: TypeError) => {
                const toDiscreteError = () => {
                    Board.toDiscrete(board)
                };

                expect(toDiscreteError).toThrow(error);
            });
        });
    });

    describe('toDiscreteArray', () => {
        describe('happy flows', () => {
            test('should return array of objects reflecting IBoard interface', () => {
                const discreteBoardArray = Board.toDiscreteArray([board]);

                expect(Array.isArray(discreteBoardArray)).toBeTruthy();
            });
        });

        describe('exception flows', () => {
            test.each(
                [
                    [ [], new Error(`Parameter boards should contain at least one element. Received array length is 0.`)],
                    [ 'bacon', new TypeError(`Parameter boards should be an array. Received type is string.`)],
                    [ 1337, new TypeError(`Parameter boards should be an array. Received type is number.`)],
                    [ ['bacon'], new TypeError(`Parameter board should be of type object. Received type is string.`)],
                    [ [1337], new TypeError(`Parameter board should be of type object. Received type is number.`)],
                ]
            )
            ('should throw TypeError', (boards: any, error: Error) => {
                const toDiscreteArrayError = () => {
                    Board.toDiscreteArray(boards);
                };

                expect(toDiscreteArrayError).toThrow(error);
            });
        });
    });

    describe('executeAction', () => {
        describe('happy flows', () => {
            test.each(
                [
                    ['TOGGLELED', 'toggleLED', []],
                    ['BLINKON', 'setBlinkLEDEnabled', [true]],
                    ['BLINKOFF', 'setBlinkLEDEnabled', [false]],
                    ['SETPINVALUE', 'setPinValue', [0,128]],
                ]
            )
            ('should run %s method and emit update', (action: string, method: string, parameters: any[]) => {
                board.online = true;
                board[method] = jest.fn();

                board.executeAction(action, parameters);

                expect(board[method]).toHaveBeenCalledWith(...parameters);
                expect(board.firmataBoard.emit).toHaveBeenCalled();
            });
        });

        describe('exception flows', () => {
            test('should throw error when board not online', () => {
                const executeAction = () => {
                    board.executeAction('TOGGLELED');
                };

                expect(executeAction).toThrowError(new CommandUnavailableError( `Unable to execute command on this board since it is not online.` ));
            });

            // unavailable method should throw error when running executeAction method
            test.each(
                [
                    ['bacon', new CommandUnavailableError( `'bacon' is not a valid action for this board.` )],
                    [1337, new CommandUnavailableError( `'1337' is not a valid action for this board.` )],
                ]
            )
            ('should should throw error when action not valid', ( invalidAction: any, error: Error ) => {
                const executeAction = () => {
                    board.executeAction(invalidAction);
                };

                board.online = true;

                expect(executeAction).toThrowError(error);
            });

            test('should throw error when board not online', () => {
                const executeAction = () => {
                    board.executeAction('TOGGLELED');
                };

                expect(executeAction).toThrowError(new CommandUnavailableError( `Unable to execute command on this board since it is not online.` ));
            });

            test('should should throw error when action not valid', () => {
                const executeAction = () => {
                    board.executeAction('bacon');
                };

                board.online = true;

                expect(executeAction).toThrowError(new CommandUnavailableError( `'bacon' is not a valid action for this board.` ));
            });
        });
    });

    describe('disconnect', () => {
        test('should disconnect the board and clear listeners', () => {
            board.online = true;
            board.clearAllTimers = jest.fn();
            const removeAllListeners = board.firmataBoard.removeAllListeners;

            board.disconnect();

            expect(removeAllListeners).toHaveBeenCalled();
            expect(board.clearAllTimers).toHaveBeenCalled();
            expect(board.online).toBeFalsy();
            expect(board.firmataBoard).toBeFalsy();
        });
    });

    describe('clearAllTimers', () => {
        test('should clear all timers and intervals', () => {
            board.clearAllIntervals = jest.fn();
            board.clearAllTimeouts = jest.fn();
            board.clearListeners = jest.fn();

            board.clearAllTimers();

            expect(board.clearAllIntervals).toHaveBeenCalled();
            expect(board.clearAllTimeouts).toHaveBeenCalled();
            expect(board.clearListeners).toHaveBeenCalled();
        });
    });

    describe('clearListeners', () => {
        test('should remove all listeners from pins and firmataBoard', () => {
            board.clearListeners();

            expect(board.firmataBoard.removeListener.mock.calls[0][0]).toEqual('digital-read-1');
            expect(board.firmataBoard.removeListener.mock.calls[1][0]).toEqual('analog-read-0');
            expect(board.firmataBoard.removeListener.mock.calls[2][0]).toEqual('queryfirmware');
            expect(board.firmataBoard.removeListener).toHaveBeenCalledTimes(3);
        });
    });

    describe('clearInterval', () => {
        describe('happy flows', () => {
            test('should clear the supplied interval', () => {
                const interval = setInterval(jest.fn(), 1000);
                board.intervals = [interval];

                board.clearInterval(interval);

                expect(board.intervals.length).toEqual(0);
            });
        });

        describe('exception flows', () => {
            test('should throw an error if interval doesn\'t exist', () => {
                const interval = setInterval(jest.fn(), 1000);

                const clearIntervalError = () => {
                    board.clearInterval(interval);
                };

                expect(clearIntervalError).toThrowError(new Error('Interval doesn\'t exist.'));
            });
        });
    });

    describe('clearTimeout', () => {
        describe('happy flows', () => {
            test('should clear the supplied timeout', () => {
                const timeout = setTimeout(jest.fn(), 1000);
                board.timeouts = [timeout];

                board.clearTimeout(timeout);

                expect(board.timeouts.length).toEqual(0);
            });
        });

        describe('exception flows', () => {
            test('should throw an error if timeout doesn\'t exist', () => {
                const timeout = setTimeout(jest.fn(), 1000);

                const clearTimeoutError = () => {
                    board.clearTimeout(timeout);
                };

                expect(clearTimeoutError).toThrowError(new Error('Timeout doesn\'t exist.'));
            });
        });
    });

    describe('setBlinkLEDEnabled', () => {
        beforeAll(() => {
            jest.useFakeTimers();
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        describe('happy flows', () => {
            test('should execute toggleLED three times', () => {
                board.toggleLED = jest.fn();

                board.setBlinkLEDEnabled(true);

                expect(setInterval).toHaveBeenCalledWith(board.toggleLED, 500);
                expect(board.blinkInterval).toBeDefined();
                expect(board.intervals.length).toEqual(1);

                jest.advanceTimersByTime(1100);

                expect(board.toggleLED).toHaveBeenCalledTimes(2);
            });

            test('should stop blinking the LED', () => {
                board.toggleLED = jest.fn();
                board.setBlinkLEDEnabled(true);

                board.setBlinkLEDEnabled(false);

                expect(board.blinkInterval).toBeUndefined();
                expect(board.intervals.length).toEqual(0);
            });
        });

        describe('exception flows', () => {
            test('should throw an error when already blinking the LED', () => {
                board.toggleLED = jest.fn();
                board.blinkInterval = 1;

                const blinkLed = () => {
                    board.setBlinkLEDEnabled(true);
                };

                expect(blinkLed).toThrowError(new CommandUnavailableError( `LED blink is already enabled.` ));
            });
        });
    });


    describe('toggleLED', () => {
        test('should set the value of the LED pin to HIGH when initial value is LOW', () => {
            board.architecture.pinMap.LED = 1;
            board.setPinValue = jest.fn();

            board.toggleLED();

            expect(board.setPinValue).toHaveBeenCalledWith( board.architecture.pinMap.LED, FirmataBoard.PIN_STATE.HIGH );
        });

        test('should set the value of the LED pin to LOW when initial value is HIGH', () => {
            board.firmataBoard.pins[1].value = 1;

            board.architecture.pinMap.LED = 1;
            board.setPinValue = jest.fn();

            board.toggleLED();

            expect(board.setPinValue).toHaveBeenCalledWith( board.architecture.pinMap.LED, FirmataBoard.PIN_STATE.LOW );
        });
    });

    describe('startHeartbeat', () => {
        beforeAll(() => {
            jest.useFakeTimers();
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        describe('happy flows', () => {
            test('should set a heartbeat interval', () => {
                board.startHeartbeat();

                // @ts-ignore
                jest.advanceTimersByTime(Board.heartbeatInterval);

                expect(setInterval).toHaveBeenCalled();
                expect(board.intervals.length).toEqual(1);
            });

            test('should set a heartbeat timeout', () => {
                board.startHeartbeat();

                // @ts-ignore
                jest.advanceTimersByTime(Board.heartbeatInterval);

                expect(board.heartbeatTimeout).toBeDefined();
            });

            test('shouldn\'t timeout if the board replies on time', () => {
                const numheartbeats = 2;

                board.startHeartbeat();

                // @ts-ignore
                jest.advanceTimersByTime(Board.heartbeatInterval * numheartbeats);

                expect(board.firmataBoard.queryFirmware).toHaveBeenCalledTimes(numheartbeats);
            });
        });

        describe('exception flows', () => {
            test('should timeout if no response is received within 10 seconds', () => {
                // @ts-ignore
                board.firmataBoard.queryFirmware = jest.fn( callback => setTimeout( callback, Board.disconnectTimeout + 1000 ));

                board.startHeartbeat();

                // @ts-ignore
                jest.advanceTimersByTime(Board.heartbeatInterval + Board.disconnectTimeout + 100);

                expect(board.heartbeatTimeout).toBeUndefined();
                expect(board.firmataBoard.emit).toHaveBeenCalledWith('disconnect');
            });
        });
    });

    describe('clearHeartbeatTimeout', () => {
        test('should clear the heartbeat timeout', () => {
            board.heartbeatTimeout = setTimeout(() => {});
            board.timeouts.push(board.heartbeatTimeout);

            board.clearHeartbeatTimeout();

            expect(board.heartbeatTimeout).toBeUndefined();
            expect(board.timeouts.length).toEqual(0);
        });
    });

    // fixme this fails if I use bytes, why? numbers should also be converted to bytes, shouldn't they? Returned value is [1, 3, 3, 7]
    describe('serialWriteBytes', () => {
        describe('happy flows', () => {
            test('should write an array of numbers converted to bytes to a serial port', () => {
                board.serialWriteBytes(FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, [ 'h', 1, 3, 3, 7 ]);

                expect(board.firmataBoard.serialWrite).toHaveBeenCalledWith( FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, [ 104, 1, 3, 3, 7 ] );
            });

            test('should write an array of characters converted to bytes to a serial port', () => {
                board.serialWriteBytes(FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, ['h', 'e', 'l', 'l', 'o']);

                expect(board.firmataBoard.serialWrite).toHaveBeenCalledWith( FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, [ 104, 101, 108, 108, 111 ] );
            });
        });

        describe('exception flows', () => {
            test('should throw TypeError', () => {
                const serialWriteBytesError = () => {
                    board.serialWriteBytes(FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, [{}, {}]);
                };

                expect(serialWriteBytesError).toThrowError(new TypeError(`Expected string or number. Received object.`));
            });
        });
    });

    describe('emitUpdate', () => {
        test('should emit an update event containing a discrete copy of the board instance', () => {
            board.emitUpdate();

            expect(board.firmataBoard.emit).toHaveBeenCalledWith( 'update', Board.toDiscrete(board) )
        });
    });

    describe('setPinValue', () => {
        describe('happy flows', () => {
            test('should call analogWrite when supplied with an analog pin', () => {
                const value = 128;
                const pin = 0;
                board.emitUpdate = jest.fn();

                board.setPinValue(pin, value);

                expect( board.firmataBoard.analogWrite ).toHaveBeenCalledWith( pin, value );
                expect(board.emitUpdate).toHaveBeenCalled();
            });

            test('should call digitalWrite when supplied with a digital pin', () => {
                const value = 1;
                const pin = 1;
                board.emitUpdate = jest.fn();

                board.setPinValue(pin, value);

                expect( board.firmataBoard.digitalWrite ).toHaveBeenCalledWith( pin, value );
                expect(board.emitUpdate).toHaveBeenCalled();
            });
        });

        describe('exception flows', () => {
            test('should throw an error if non existent pin is supplied', () => {
                const value = 1;
                const pin = 1337;

                const setPinValue = () => {
                    board.setPinValue(pin, value);
                };

                expect( setPinValue ).toThrowError( new Error("blargh") );
            });

            test.each(
                [
                    [0, -20, new CommandMalformed( `Tried to write value -20 to analog pin 0. Only values between or equal to 0 and 1023 are allowed.` )],
                    [0, 2000, new CommandMalformed( `Tried to write value 2000 to analog pin 0. Only values between or equal to 0 and 1023 are allowed.` )]
                ])('should throw an error if an invalid value is supplied for an analog pin', (pin: number, value: number, expectedError: Error) => {
                const setPinValue = () => {
                    board.setPinValue(pin, value);
                };

                expect( setPinValue ).toThrowError( expectedError );
            });

            test('should throw an error if a non-binary value is supplied while setting a digital pin', () => {
                const value = 2;
                const pin = 1;

                const setPinValue = () => {
                    board.setPinValue(pin, value);
                };

                expect( setPinValue ).toThrowError( new CommandMalformed( `Tried to write value ${ value } to digital pin ${ pin }. Only values 1 (HIGH) or 0 (LOW) are allowed.` ) );
            });
        });
    });

    describe('attachDigitalPinListeners', () => {
        test('should attach listeners to all digital pins', () => {
            const pin = 1;

            board.attachDigitalPinListeners();

            expect(board.firmataBoard.digitalRead).toHaveBeenCalledTimes(1);
            expect(board.firmataBoard.digitalRead).toHaveBeenCalledWith( pin, board.emitUpdate);
        });
    });

    describe('attachAnalogPinListeners', () => {
        test('should attach listeners to all analog pins', () => {
            const pin = 0;

            board.attachAnalogPinListeners();

            expect(board.firmataBoard.analogRead).toHaveBeenCalledTimes(1);
            expect(board.firmataBoard.analogRead).toHaveBeenCalledWith( pin, board.emitUpdate);
        });
    });

    describe('compareAnalogReadout', () => {
        test('should update the previous analog value', () => {
            board.emitUpdate = jest.fn();
            const pin = 0;
            const value = 700;

            board.compareAnalogReadout(pin, value);

            expect(board.previousAnalogValue[pin]).toEqual(value);
            expect(board.emitUpdate).toHaveBeenCalledTimes(1);
        });

        test('should retain the previous analog value', () => {
            board.emitUpdate = jest.fn();
            const pin = 0;
            const value = 512;

            board.compareAnalogReadout(pin, value);
            board.compareAnalogReadout(pin, value);

            expect(board.previousAnalogValue[pin]).toEqual(value);
            expect(board.emitUpdate).toHaveBeenCalledTimes(1);
        });
    });

    describe('clearAllIntervals', () => {
        test('should clear all intervals', () => {
            board.intervals.push(setInterval(() => {}, 1000));
            board.clearAllIntervals();

            expect(board.intervals.length).toEqual(0);
        });
    });

    describe('clearAllTimeouts', () => {
        test('should clear all timeouts', () => {
            board.timeouts.push(setTimeout(() => {}, 1000));
            board.clearAllTimeouts();

            expect(board.timeouts.length).toEqual(0);
        });
    });

    describe('isAvailableAction', () => {
        test('should return true if action is available', () => {
            expect(board.isAvailableAction('TOGGLELED')).toEqual(true);
        });

        test('should return false if action is not available', () => {
            expect(board.isAvailableAction('bacon')).toEqual(false);
        });
    });

    describe('isDigitalPin', () => {
        test('should return true when a digital pin\'s index is passed in', () => {
            const pinIndex = 1;

            expect(board.isDigitalPin(pinIndex)).toEqual(true);
        });

        test('should return false when an analog pin\'s index is passed in', () => {
            const pinIndex = 0;

            expect(board.isDigitalPin(pinIndex)).toEqual(false);
        });
    });

    describe('isAnalogPin', () => {
        test('should return true when an analog pin\'s index is passed in', () => {
            const pinIndex = 0;

            expect(board.isAnalogPin(pinIndex)).toEqual(true);
        });

        test('should return false when a digital pin\'s index is passed in', () => {
            const pinIndex = 1;

            expect(board.isAnalogPin(pinIndex)).toEqual(false);
        });
    });
});
