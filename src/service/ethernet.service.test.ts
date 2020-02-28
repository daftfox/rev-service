import { Socket } from 'net';
import { EthernetService } from './index';
import { LoggerService } from './logger.service';
jest.mock('./logger.service');
jest.mock('./configuration.service');

let ethernetService: any;

beforeEach(() => {
    ethernetService = new EthernetService();
});

afterEach(() => {
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

    describe('#listen', () => {
        test('should have logged an info message', () => {
            ethernetService.server.listen = jest.fn();

            ethernetService.listen();

            expect(LoggerService.info).toHaveBeenCalled();
        });

        test('should have created a Server instance', () => {
            ethernetService.server.listen = jest.fn();
            ethernetService.listen();

            expect(ethernetService.server.listen).toHaveBeenCalled();
        });
    });

    describe('#handleConnectionRequest', () => {
        test('should log a debug message and call connectToBoard', async () => {
            ethernetService.connectToBoard = jest.fn(() => Promise.resolve({ id: 'bacon' }));

            const mockSocket = new Socket();

            await ethernetService.handleConnectionRequest(mockSocket);

            expect(LoggerService.debug).toHaveBeenCalled();
            expect(ethernetService.connectToBoard).toHaveBeenCalled();
        });

        test('should execute handleDisconnected method', async () => {
            ethernetService.handleDisconnected = jest.fn();
            ethernetService.connectToBoard = jest.fn(() => Promise.reject({}));

            const mockSocket = new Socket();

            await ethernetService.handleConnectionRequest(mockSocket);

            expect(ethernetService.handleDisconnected).toHaveBeenCalled();
            expect(ethernetService.connectToBoard).toHaveBeenCalled();
        });
    });

    describe('#closeServer', () => {
        test('should have called server.close', () => {
            ethernetService.server.close = jest.fn();

            ethernetService.closeServer();

            expect(ethernetService.server.close).toHaveBeenCalled();
        });
    });

    describe('#handleDisconnected', () => {
        test('should call socket.end and socket.destroy methods', () => {
            const mockSocket = new Socket();
            mockSocket.end = jest.fn();
            mockSocket.destroy = jest.fn();

            ethernetService.handleDisconnected(mockSocket);

            expect(mockSocket.end).toHaveBeenCalled();
            expect(mockSocket.destroy).toHaveBeenCalled();
        });
    });
});
