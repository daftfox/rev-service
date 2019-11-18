import EthernetService from '../service/ethernet-service';
import Boards from '../model/boards';
import { Socket } from 'net';
import SerialService from '../service/serial-service';

let serialService: any;

console.info = () => {};

beforeEach(() => {
    const model = new Boards();
    serialService = new SerialService(model);
});

afterEach(async () => {
    serialService.closeServer();
});

describe('SerialService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(serialService).toBeDefined();
        });
    });

    describe('#listen', () => {
        test('should have logged an info message', () => {
            serialService.log.info = jest.fn();

            serialService.listen();

            expect(serialService.log.info).toHaveBeenCalled();
        });

        test('should have created an interval instance', () => {
            serialService.listen();

            expect(serialService.portScanInterval).toBeDefined();
        });
    });

    xdescribe('#attemptConnection', () => {
        test('should execute handleDisconnected method', async () => {
            serialService.handleDisconnected = jest.fn();
            serialService.connectToBoard = jest.fn(() => Promise.reject({}));

            const mockSocket = new Socket();

            await serialService.attemptConnection(mockSocket);

            expect(serialService.handleDisconnected).toHaveBeenCalled();
            expect(serialService.connectToBoard).toHaveBeenCalled();
        });

        // do
        // test('should log a debug message and call connectToBoard', () => {
        //     ethernetService.log.debug = jest.fn();
        //     ethernetService.connectToBoard = jest.fn();
        //
        //     const mockSocket = new Socket();
        //
        //     ethernetService.handleConnectionRequest(mockSocket);
        //
        //     expect(ethernetService.log.debug).toHaveBeenCalled();
        //     expect(ethernetService.connectToBoard).toHaveBeenCalled();
        // });
    });

    describe('#closeServer', () => {
        test('should clear the portScanInterval', () => {
            serialService.closeServer();

            expect(serialService.portScanInterval).toBeUndefined();
        });
    });

    xdescribe('#handleDisconnected', () => {
        test('should call socket.end and socket.destroy methods', () => {
            const mockSocket = new Socket();
            mockSocket.end = jest.fn();
            mockSocket.destroy = jest.fn();

            serialService.handleDisconnected(mockSocket);

            expect(mockSocket.end).toHaveBeenCalled();
            expect(mockSocket.destroy).toHaveBeenCalled();
        });

        test('should log an info message and call model.disconnectBoard', () => {
            const mockSocket = new Socket();
            const mockBoard = {
                id: 'bacon',
            };
            serialService.log.info = jest.fn();
            serialService.model.disconnectBoard = jest.fn();

            serialService.handleDisconnected(mockSocket, mockBoard);

            expect(serialService.log.info).toHaveBeenCalled();
            expect(serialService.model.disconnectBoard).toHaveBeenCalledWith(mockBoard.id);
        });
    });
});
