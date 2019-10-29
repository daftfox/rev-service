import MainController from '../controller/main';
import BoardsMock from "./mocks/boards.mock";

let mainController: any;

beforeEach(() => {
    mainController = new MainController();
});

afterEach(() => {
    mainController.stopService();
});

describe('MainController:', () => {
    test('is instantiated', () => {
        expect(mainController).toBeDefined();
    });

    test('options should be defined', () => {
        expect(mainController.options).toBeDefined();
    });

    test('.startSerialService() instantiates serial service', () => {
        mainController.startSerialService( undefined );

        expect(mainController.serialService).toBeDefined();
    });

    test('.startEthernetService() instantiates ethernet service', () => {
        mainController.startEthernetService( undefined, 9000 );

        expect(mainController.ethernetService).toBeDefined();
    });

    test('.startWebSocketService() instantiates web socket service', () => {
        const boardsMock = new BoardsMock();
        const webSocketOptions = {
            port: 3001,
            boardModel: boardsMock,
            programModel: {}
        };

        mainController.startWebSocketService( webSocketOptions );

        expect(mainController.socketService).toBeDefined();
    });

    test('.startDatabaseService() instantiates database service', () => {
        const databaseOptions = {
            schema: 'rev',
            host: 'localhost',
            port: 3306,
            username: '',
            password: '',
            dialect: 'sqlite',
            path: 'database/rev.db'
        };

        mainController.startDatabaseService( databaseOptions );

        expect(mainController.databaseService).toBeDefined();
    });

    test('.synchroniseDataModels() resolves after synchronising data models', (done) => {
        const databaseOptions = {
            schema: 'rev',
            host: 'localhost',
            port: 3306,
            username: '',
            password: '',
            dialect: 'sqlite',
            path: 'database/rev.db'
        };

        mainController.startDatabaseService( databaseOptions );
        mainController.instantiateDataModels();

        mainController.synchroniseDataModels().then(done);
    });

    test('.instantiateDataModels() instantiates models', () => {
        mainController.instantiateDataModels();

        expect(mainController.boardModel).toBeDefined();
        expect(mainController.programModel).toBeDefined();
    });

    test('.startAllServices() starts all services', async () => {
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
            dbPath: 'database/rev.db',
            dbDialect: 'sqlite',
            dbSchema: 'rev',
            port: 3001,
            debug: true,
            ethernet: true,
            serial: true,
        };

        await mainController.startAllServices();

        expect(mainController.startDatabaseService).toHaveBeenCalled();
        expect(mainController.instantiateDataModels).toHaveBeenCalled();
        expect(mainController.synchroniseDataModels).toHaveBeenCalled();
        expect(mainController.startWebSocketService).toHaveBeenCalled();
        expect(mainController.startEthernetService).toHaveBeenCalled();
        expect(mainController.startSerialService).toHaveBeenCalled();
    });

    test('.startAllServices() starts all services except serial and ethernet', async () => {
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
            dbPath: 'database/rev.db',
            dbDialect: 'sqlite',
            dbSchema: 'rev',
            port: 3001,
            debug: true,
            ethernet: false,
            serial: false,
        };

        await mainController.startAllServices();

        expect(mainController.startDatabaseService).toHaveBeenCalled();
        expect(mainController.instantiateDataModels).toHaveBeenCalled();
        expect(mainController.synchroniseDataModels).toHaveBeenCalled();
        expect(mainController.startWebSocketService).toHaveBeenCalled();
        expect(mainController.startEthernetService).toHaveBeenCalledTimes(0);
        expect(mainController.startSerialService).toHaveBeenCalledTimes(0);
    });

    test('debug env parameter is set to an empty string', async () => {
        mainController.options = {
            debug: false
        };

        expect(process.env.debug).toEqual('');
    });

    test('debug env parameter is set to \'true\'', async () => {
        process.argv = [
            '/usr/local/bin/node',
            '/Users/tim/Projects/rev/rev-back-end/node_modules/jest-worker/build/workers/processChild.js',
            '--debug'
        ];
        const _mainController = new MainController();

        expect(process.env.debug).toEqual('true');
    });
});