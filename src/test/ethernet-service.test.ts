import EthernetService from '../service/ethernet-service';
import Boards from '../model/boards';
import { Socket } from 'net';

let ethernetService: any;
const port = 3001;

console.info = () => {};

beforeEach(() => {
    const model = new Boards();
    ethernetService = new EthernetService(model, port);
});

afterEach(async () => {
    ethernetService.closeServer();
});

describe('EthernetService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(ethernetService).toBeDefined();
        });

        test('should have created a Server instance', () => {
            expect(ethernetService.server).toBeDefined();
        });
    });

    describe('listen', () => {
        test('should have logged an info message', () => {
            ethernetService.log.info = jest.fn();

            ethernetService.listen(port);

            expect(ethernetService.log.info).toHaveBeenCalled();
        });

        test('should have created a Server instance', () => {
            ethernetService.server.listen = jest.fn();
            ethernetService.listen(port);

            expect(ethernetService.server.listen).toHaveBeenCalled();
        });
    });

    describe('handleConnectionRequest', () => {
        test('should log a debug message and call connectToBoard', () => {
            ethernetService.log.debug = jest.fn();
            ethernetService.connectToBoard = jest.fn();

            const mockSocket = new Socket();

            ethernetService.handleConnectionRequest(mockSocket);

            expect(ethernetService.log.debug).toHaveBeenCalled();
            expect(ethernetService.connectToBoard).toHaveBeenCalled();
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

    describe('closeServer', () => {
        test('should have called server.close', () => {
            ethernetService.server.close = jest.fn();

            ethernetService.closeServer();

            expect(ethernetService.server.close).toHaveBeenCalled();
        });
    });

    describe('handleDisconnected', () => {
        test('should call socket.end and socket.destroy methods', () => {
            const mockSocket = new Socket();
            mockSocket.end = jest.fn();
            mockSocket.destroy = jest.fn();

            ethernetService.handleDisconnected(mockSocket);

            expect(mockSocket.end).toHaveBeenCalled();
            expect(mockSocket.destroy).toHaveBeenCalled();
        });

        test('should log an info message and call model.disconnectBoard', () => {
            const mockSocket = new Socket();
            const mockBoard = {
                id: 'bacon',
            };
            ethernetService.log.info = jest.fn();
            ethernetService.model.disconnectBoard = jest.fn();

            ethernetService.handleDisconnected(mockSocket, mockBoard);

            expect(ethernetService.log.info).toHaveBeenCalled();
            expect(ethernetService.model.disconnectBoard).toHaveBeenCalledWith(mockBoard.id);
        });
    });
});
