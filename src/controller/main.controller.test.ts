import { MainController } from './index';
import { BoardService, DatabaseService, EthernetService, SerialService, WebSocketService } from '../service';
import { container } from 'tsyringe';
import { ConfigurationService } from '../service/configuration.service';
import { LoggerService } from '../service/logger.service';
jest.mock('../service/serial.service');
jest.mock('../service/logger.service');

let controller: MainController;

const properties = {
    stopServices: 'stopServices',
    appConfiguration: 'appConfiguration',
    startSerialService: 'startSerialService',
    startEthernetService: 'startEthernetService',
    startWebSocketService: 'startWebSocketService',
    startDatabaseService: 'startDatabaseService',
    synchroniseDataModels: 'synchroniseDataModels',
    startAllServices: 'startAllServices',
    namespace: 'namespace',
};

const configurationServiceMock = {
    appConfiguration: {
        debug: false,
        serial: true,
        ethernet: true,
    },
};

const boardServiceMock = {
    updateCache: jest.fn(() => Promise.resolve()),
};

const databaseServiceMock = {
    synchronise: jest.fn(() => Promise.resolve()),
    insertDefaultRecords: jest.fn(() => Promise.resolve()),
};

const serialServiceMock = {
    listen: jest.fn(),
    closeServer: jest.fn(),
};

const ethernetServiceMock = {
    listen: jest.fn(),
    closeServer: jest.fn(),
};

const webSocketServiceMock = {
    listen: jest.fn(),
    closeServer: jest.fn(),
};

beforeAll(() => {
    container.registerInstance(ConfigurationService, configurationServiceMock);
    container.registerInstance<any>(SerialService, serialServiceMock);
    container.registerInstance<any>(EthernetService, ethernetServiceMock);
    container.registerInstance<any>(WebSocketService, webSocketServiceMock);
    container.registerInstance<any>(DatabaseService, databaseServiceMock);
    container.registerInstance<any>(BoardService, boardServiceMock);
});

beforeEach(() => {
    controller = new MainController();
});

afterEach(() => {
    process.removeAllListeners('uncaughtException');
});

describe('MainController:', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(controller).toBeDefined();
        });

        test('should have defined options', () => {
            expect(controller[properties.appConfiguration]).toBeDefined();
        });

        test('should have set debug env parameter to an empty string by default', async () => {
            expect(process.env.debug).toEqual('');
        });

        test('should have set debug env parameter to true', async () => {
            configurationServiceMock.appConfiguration.debug = true;

            const c = new MainController();

            expect(process.env.debug).toEqual('true');
        });
    });

    describe('#startSerialService', () => {
        test('should start listening using serial service', () => {
            MainController[properties.startSerialService]();

            expect(serialServiceMock.listen).toHaveBeenCalled();
        });
    });

    describe('#startEthernetService', () => {
        test('should start listening using ethernet service', () => {
            MainController[properties.startEthernetService]();

            expect(ethernetServiceMock.listen).toHaveBeenCalled();
        });
    });

    describe('#startWebSocketService', () => {
        test('should start listening using web socket service', () => {
            MainController[properties.startWebSocketService]();

            expect(webSocketServiceMock.listen).toHaveBeenCalled();
        });
    });

    describe('#startDatabaseService', () => {
        test('should initiate database service and synchronise with database', async () => {
            await MainController[properties.startDatabaseService]();

            expect(databaseServiceMock.synchronise).toHaveBeenCalled();
            expect(databaseServiceMock.insertDefaultRecords).toHaveBeenCalled();
        });
    });

    describe('synchroniseDataModels', () => {
        test('should synchronise BoardService cache with database', async () => {
            await MainController[properties.synchroniseDataModels]();

            expect(boardServiceMock.updateCache).toHaveBeenCalled();
        });
    });

    describe('#startAllServices', () => {
        beforeEach(() => {
            spyOn<any>(MainController, 'startDatabaseService').and.callThrough();
            spyOn<any>(MainController, 'synchroniseDataModels').and.callThrough();
            spyOn<any>(MainController, 'startWebSocketService');
            spyOn<any>(MainController, 'startEthernetService');
            spyOn<any>(MainController, 'startSerialService');
        });
        test('should start all services by default', async () => {
            await controller[properties.startAllServices]();

            expect(MainController[properties.startDatabaseService]).toHaveBeenCalled();
            expect(MainController[properties.synchroniseDataModels]).toHaveBeenCalled();
            expect(MainController[properties.startWebSocketService]).toHaveBeenCalled();
            expect(MainController[properties.startEthernetService]).toHaveBeenCalled();
            expect(MainController[properties.startSerialService]).toHaveBeenCalled();
        });

        test('should not start ethernet and serial services', async () => {
            controller[properties.appConfiguration].serial = false;
            controller[properties.appConfiguration].ethernet = false;
            await controller[properties.startAllServices]();

            expect(MainController[properties.startDatabaseService]).toHaveBeenCalled();
            expect(MainController[properties.synchroniseDataModels]).toHaveBeenCalled();
            expect(MainController[properties.startWebSocketService]).toHaveBeenCalled();
            expect(MainController[properties.startEthernetService]).not.toHaveBeenCalled();
            expect(MainController[properties.startSerialService]).not.toHaveBeenCalled();
        });
    });

    describe('#stopServices', () => {
        test('should call closeServer on all services', () => {
            MainController[properties.stopServices]();

            expect(ethernetServiceMock.closeServer).toHaveBeenCalled();
            expect(serialServiceMock.closeServer).toHaveBeenCalled();
            expect(webSocketServiceMock.closeServer).toHaveBeenCalled();
        });
    });

    describe('uncaughtException listener', () => {
        test('should print the stacktrace when an uncaught exception occurs', async () => {
            const error = new Error('Oops, something went wrong');
            process.emit('uncaughtException', error);

            expect(LoggerService.stack).toHaveBeenCalledWith(error, controller[properties.namespace]);
        });
    });
});
