import MainController from '../controller/main';
import BoardsMock from "./mocks/boards.mock";

let mainController: any;

// keeps the terminal clean
console.info = () => {};

beforeEach(() => {
    mainController = new MainController();
});

afterEach(() => {
    mainController.stopService();
});

describe('MainController:', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(mainController).toBeDefined();
        });

        test('should have defined options', () => {
            expect(mainController.options).toBeDefined();
        });

        test('should have set debug env parameter to an empty string by default', async () => {
            expect(process.env.debug).toEqual('');
        });

        test('should have set debug env parameter to \'true\'', async () => {
            process.argv = [
                '/usr/local/bin/node',
                '/Users/tim/Projects/rev/rev-back-end/node_modules/jest-worker/build/workers/processChild.js',
                '--debug'
            ];
            const _mainController = new MainController();

            expect(process.env.debug).toEqual('true');
        });
    });

    describe('startSerialService', () => {
        test('should instantiate serial service', () => {
            mainController.startSerialService( undefined );

            expect(mainController.serialService).toBeDefined();
        });
    });

    describe('startEthernetService', () => {
        test('should instantiate ethernet service', () => {
            mainController.startEthernetService( undefined, 9000 );

            expect(mainController.ethernetService).toBeDefined();
        });
    });

    describe('startWebSocketService', () => {
        test('should instantiate web socket service', () => {
            const boardsMock = new BoardsMock();
            const webSocketOptions = {
                port: 3001,
                boardModel: boardsMock,
                programModel: {}
            };

            mainController.startWebSocketService( webSocketOptions );

            expect(mainController.socketService).toBeDefined();
        });
    });

    describe('startDatabaseService', () => {
        test('should instantiate database service', () => {
            const databaseOptions = {
                schema: 'rev',
                host: 'localhost',
                port: 3306,
                username: '',
                password: '',
                dialect: 'sqlite',
                path: ':memory:'
            };

            mainController.startDatabaseService( databaseOptions );

            expect(mainController.databaseService).toBeDefined();
        });
    });

    describe('synchroniseDataModels', () => {
        test('should resolve after synchronising data models', () => {
            const databaseOptions = {
                schema: 'rev',
                host: 'localhost',
                port: 3306,
                username: '',
                password: '',
                dialect: 'sqlite',
                path: ':memory:'
            };

            return mainController.startDatabaseService( databaseOptions )
                .then(() => {
                    mainController.instantiateDataModels();

                    return mainController.synchroniseDataModels();
                });
        });
    });

    describe('instantiateDataModels', () => {
        test('should instantiate models', () => {
            mainController.instantiateDataModels();

            expect(mainController.boardModel).toBeDefined();
            expect(mainController.programModel).toBeDefined();
        });
    });

    describe('startAllServices', () => {
        beforeEach(() => {
            mainController.startDatabaseService = jest.fn(() => Promise.resolve());
            mainController.instantiateDataModels = jest.fn();
            mainController.synchroniseDataModels = jest.fn(() => Promise.resolve());
            mainController.startWebSocketService = jest.fn();
            mainController.startEthernetService = jest.fn();
            mainController.startSerialService = jest.fn();
            mainController.options = {
                dbUsername: '',
                dbPassword: '',
                dbHost: 'localhost',
                dbPort: 3306,
                dbPath: ':memory:',
                dbDialect: 'sqlite',
                dbSchema: 'rev',
                port: 3001,
                debug: true,
                ethernet: true,
                serial: true,
            };
        });

        test('should start all services', () => {
            return mainController.startAllServices()
                .then(() => {
                    expect(mainController.startDatabaseService).toHaveBeenCalled();
                    expect(mainController.instantiateDataModels).toHaveBeenCalled();
                    expect(mainController.synchroniseDataModels).toHaveBeenCalled();
                    expect(mainController.startWebSocketService).toHaveBeenCalled();
                    expect(mainController.startEthernetService).toHaveBeenCalled();
                    expect(mainController.startSerialService).toHaveBeenCalled();
                });
        });

        test('should start all services except serial and ethernet', () => {
            mainController.options.ethernet = false;
            mainController.options.serial = false;

            return mainController.startAllServices()
                .then(() => {
                    expect(mainController.startDatabaseService).toHaveBeenCalled();
                    expect(mainController.instantiateDataModels).toHaveBeenCalled();
                    expect(mainController.synchroniseDataModels).toHaveBeenCalled();
                    expect(mainController.startWebSocketService).toHaveBeenCalled();
                    expect(mainController.startEthernetService).toHaveBeenCalledTimes(0);
                    expect(mainController.startSerialService).toHaveBeenCalledTimes(0);
                });
        });
    });
});