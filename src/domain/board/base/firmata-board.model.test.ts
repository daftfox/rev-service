import {FirmataBoard} from "./firmata-board.model";
import {Socket} from 'net';
import {AVAILABLE_EXTENSIONS_KEYS} from "../extension";

let firmataBoard: FirmataBoard;
let socket: Socket;

const properties = {
    firmwareUpdated: 'firmwareUpdated',
    ready: 'ready',
    error: 'error',
    update: 'update',
    disconnect: 'disconnect'
};

beforeEach(() => {
    socket = new Socket();
    firmataBoard = new FirmataBoard(socket);

    firmataBoard.firmware = {
        name: 'LedController_123456.ino',
        version: {
            major: 1,
            minor: 1
        }
    };
});

describe('FirmataBoard', () => {
    test('should be instantiated', () => {
        expect(firmataBoard).toBeDefined();
    });

    describe('#parseType', () => {
        test("should return 'LedController'", () => {
            const result = firmataBoard.parseType();

            expect(result).toEqual('LedController');
        });

        test.each([
            ['scrambled.ino'],
            ['_123.ino'],
            ['unsupportedtype.ino'],
        ])("should return 'Board'", (firmwareName: string) => {
            firmataBoard.firmware.name = firmwareName;
            const result = firmataBoard.parseType();

            expect(result).toEqual(AVAILABLE_EXTENSIONS_KEYS.BOARD);
        });
    });

    describe('#parseId', () => {
        test("should return '123456'", () => {
            const result = firmataBoard.parseId();

            expect(result).toEqual('123456');
        });
    });

    describe('events', () => {
        test('should execute post method of firmwareUpdated property', () => {
            const spy = spyOn(firmataBoard.firmwareUpdated, 'post');

            firmataBoard.emit('queryfirmware');

            expect(spy).toHaveBeenCalledWith({id: '123456', type: 'LedController'});
        });

        test('should execute post method of ready property', () => {
            const spy = spyOn(firmataBoard.ready, 'post');

            firmataBoard.emit('ready');

            expect(spy).toHaveBeenCalled();
        });

        test('should execute post method of error property', () => {
            const spy = spyOn(firmataBoard.error, 'post');
            const error = new Error('Oops, something went wrong.');

            firmataBoard.emit('error', error);

            expect(spy).toHaveBeenCalledWith(error);
        });

        test('should execute post method of disconnect property', () => {
            const spy = spyOn(firmataBoard.disconnect, 'post');

            firmataBoard.emit('disconnect');

            expect(spy).toHaveBeenCalled();
        });
    });
});