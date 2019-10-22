import MainController from '../controller/main';

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

    test('options are defined', () => {
        expect(mainController.options).toBeDefined();
    });

    test('instantiates serial service', () => {
        mainController.startSerialService( null );

        expect(mainController.serialService).toBeDefined();
    });

    test('instantiates ethernet service', () => {
        mainController.startEthernetService( null, 9000 );

        expect(mainController.ethernetService).toBeDefined();
    });

    test('instantiates models', () => {
        mainController.instantiateDataModels();

        expect(mainController.boardModel).toBeDefined();
        expect(mainController.programModel).toBeDefined();
    });

    test('startServices() starts all services', async () => {
        mainController.startDatabaseService = jest.fn(() => Promise.resolve());
        mainController.instantiateDataModels = jest.fn();
        mainController.synchroniseDataModels = jest.fn(() => Promise.resolve());
        mainController.startWebSocketService = jest.fn();
        mainController.startEthernetService = jest.fn();
        mainController.startSerialService = jest.fn();

        await mainController.startAllServices();

        expect(mainController.startDatabaseService).toHaveBeenCalled();
        expect(mainController.instantiateDataModels).toHaveBeenCalled();
        expect(mainController.synchroniseDataModels).toHaveBeenCalled();
        expect(mainController.startWebSocketService).toHaveBeenCalled();
        expect(mainController.startEthernetService).toHaveBeenCalled();
        expect(mainController.startSerialService).toHaveBeenCalled();
    });
});