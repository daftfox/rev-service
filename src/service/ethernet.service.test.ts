import { Socket } from 'net';
import { EthernetService } from './index';
import { LoggerService } from './logger.service';
jest.mock('./logger.service');
jest.mock('./configuration.service');
jest.mock('net');

let service: EthernetService;

const properties = {
    server: 'server',
    connectToBoard: 'connectToBoard',
    handleDisconnected: 'handleDisconnected',
    handleConnectionRequest: 'handleConnectionRequest',
};

beforeEach(() => {
    service = new EthernetService();
});

afterEach(() => {
    service.closeServer();
});

describe('EthernetService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(service).toBeDefined();
        });

        test('should have created a Server instance', () => {
            expect(service[properties.server]).toBeDefined();
        });
    });

    describe('#listen', () => {
        test('should have logged an info message', () => {
            service.listen();

            expect(LoggerService.info).toHaveBeenCalled();
        });

        test('should have created a Server instance', () => {
            service.listen();

            expect(service[properties.server].listen).toHaveBeenCalled();
        });
    });

    describe('#handleConnectionRequest', () => {
        test('should log a debug message and call connectToBoard', async () => {
            const spy = spyOn<any>(service, 'connectToBoard').and.returnValue(Promise.resolve({ id: 'bacon' }));

            const mockSocket = new Socket();

            await service[properties.handleConnectionRequest](mockSocket);

            expect(LoggerService.debug).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });

        test('should execute handleDisconnected method', async () => {
            const spyDisconnected = spyOn<any>(service, 'handleDisconnected');
            const spyConnectToBoard = spyOn<any>(service, 'connectToBoard').and.returnValue(Promise.reject());

            const mockSocket = new Socket();

            await service[properties.handleConnectionRequest](mockSocket);

            expect(spyDisconnected).toHaveBeenCalled();
            expect(spyConnectToBoard).toHaveBeenCalled();
        });
    });

    describe('#closeServer', () => {
        test('should have called server.close', () => {
            const spy = spyOn(service[properties.server], 'close');

            service.closeServer();

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('#handleDisconnected', () => {
        test('should call socket.end and socket.destroy methods', () => {
            const mockSocket = new Socket();
            const spyEnd = spyOn(mockSocket, 'end');
            const spyDestroy = spyOn(mockSocket, 'destroy');

            service[properties.handleDisconnected](mockSocket);

            expect(spyEnd).toHaveBeenCalled();
            expect(spyDestroy).toHaveBeenCalled();
        });
    });
});
