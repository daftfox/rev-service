import Board, {PINOUT, IDLE} from '../domain/board';
import {Sequelize} from 'sequelize-typescript';
import CommandUnavailableError from "../error/command-unavailable";
import FirmataBoardMock from "./mocks/firmata-board.mock";

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
    board = new Board(null, null, null, null, 'bacon');
});

describe('Board:', () => {
    test('is instantiated', () => {
        expect(board).toBeDefined();
    });

    test('returns correct available actions', () => {
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

    test('sets pinout and pin mapping to ESP8266', () => {
        board.setPinout(PINOUT.ESP_8266);

        setTimeout(() => {
            expect(board.pinout).toEqual(PINOUT.ESP_8266);
            expect(board.pinMapping.LED).toEqual(2);
            expect(board.pinMapping.RX).toEqual(3);
            expect(board.pinMapping.TX).toEqual(1);
        });
    });

    test('sets pinout and pin mapping to Arduino Uno', () => {
        board.setPinout(PINOUT.ARDUINO_UNO);

        setTimeout(() => {
            expect(board.pinout).toEqual(PINOUT.ARDUINO_UNO);
            expect(board.pinMapping.LED).toEqual(13);
            expect(board.pinMapping.RX).toEqual(1);
            expect(board.pinMapping.TX).toEqual(0);
        });
    });

    test('throws an error when setting bad pinout', () => {
        const badPinout = () => {
            board.setPinout('bacon');
        };

        expect(badPinout).toThrowError(new Error( 'This pinout is not supported.' ));
    });

    test('sets current program to IDLE', () => {
        board.setIdle();

        expect(board.currentProgram).toBe(IDLE);
    });

    test('getFirmataBoard() returns undefined firmataboard object', () => {
        const firmataBoard = board.getFirmataBoard();

        expect(firmataBoard).toBeUndefined();
    });

    test('getFirmataBoard() returns mock firmataboard object', () => {
        board.firmataBoard = new FirmataBoardMock();
        const firmataBoard = board.getFirmataBoard();

        expect(firmataBoard).toBeDefined();
    });

    test('toDiscrete() returns object with pins property', () => {
        board.firmataBoard = new FirmataBoardMock();
        const discreteBoard = Board.toDiscrete(board);

        expect(discreteBoard).toBeDefined();
        expect(discreteBoard.online).toBeFalsy();
        expect(discreteBoard.pins).toBeDefined();
        expect(Array.isArray(discreteBoard.pins)).toBeTruthy();
        expect(discreteBoard.pins.length).toEqual(2);
        expect(discreteBoard.id).toEqual('bacon');
        expect(discreteBoard.serialConnection).toBeFalsy();
        expect(discreteBoard.lastUpdateReceived).toBeUndefined();
        expect(Array.isArray(discreteBoard.availableCommands)).toBeTruthy();
        expect(Array.isArray(discreteBoard.pins)).toBeTruthy();
    });

    test('toDiscrete() returns object without pins property', () => {
        const discreteBoard = Board.toDiscrete(board);

        expect(discreteBoard).toBeDefined();
        expect(discreteBoard.online).toBeFalsy();
        expect(discreteBoard.pins.length).toEqual(0);
        expect(discreteBoard.id).toEqual('bacon');
        expect(discreteBoard.serialConnection).toBeFalsy();
        expect(discreteBoard.lastUpdateReceived).toBeUndefined();
        expect(Array.isArray(discreteBoard.availableCommands)).toBeTruthy();
        expect(Array.isArray(discreteBoard.pins)).toBeTruthy();
    });

    test('toDiscreteArray() returns array of objects reflecting IBoard interface', () => {
        const discreteBoardArray = Board.toDiscreteArray([board]);

        expect(Array.isArray(discreteBoardArray)).toBeTruthy();
    });

    // offline board should throw error when running executeAction method
    test('executeAction() should throw error when board not online', () => {
        const executeAction = () => {
            board.executeAction('TOGGLELED');
        };

        expect(executeAction).toThrowError(new CommandUnavailableError( `Unable to execute command on this board since it is not online.` ));
    });

    // unavailable method should throw error when running executeAction method
    test('executeAction() should throw error when action not valid', () => {
        const executeAction = () => {
            board.executeAction('bacon');
        };

        board.online = true;

        expect(executeAction).toThrowError(new CommandUnavailableError( `'bacon' is not a valid action for this board.` ));
    });

    test('executeAction() should run action method and emit update when given correct action', () => {
        board.online = true;
        board.toggleLED = jest.fn();
        board.firmataBoard = new FirmataBoardMock();

        board.executeAction('TOGGLELED');

        expect(board.toggleLED).toHaveBeenCalled();
        expect(board.firmataBoard.emit).toHaveBeenCalled();
    });

    test('disconnect() should disconnect the board and clear listeners', () => {
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

    test('clearAllTimers() should clear all timers and intervals', () => {
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

    test('clearListeners() should remove all listeners from pins and firmataBoard', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;

        board.clearListeners();

        expect(mockFirmataBoard.removeListener.mock.calls[0][0]).toEqual('digital-read-1');
        expect(mockFirmataBoard.removeListener.mock.calls[1][0]).toEqual('analog-read-0');
        expect(mockFirmataBoard.removeListener.mock.calls[2][0]).toEqual('queryfirmware');
        expect(mockFirmataBoard.removeListener).toHaveBeenCalledTimes(3);
    });

    test('clearInterval() should clear the supplied interval', () => {
        const interval = setInterval(jest.fn(), 1000);
        board.intervals = [interval];

        board.clearInterval(interval);

        expect(board.intervals.length).toEqual(0);
    });
});