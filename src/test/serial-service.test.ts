import Boards from '../model/boards';
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

        test('should have called getAvailableSerialPorts and attemptConnectionToPorts', async () => {
            serialService.scanPorts = jest.fn();

            jest.useFakeTimers();
            serialService.listen();

            jest.advanceTimersByTime(20000);
            jest.useRealTimers();

            expect(serialService.scanPorts).toHaveBeenCalledTimes(2);
        });
    });

    describe('#attemptConnectionToPort', () => {
        const port = { comName: 'test' };

        test('should call handleConnected', async () => {
            serialService.handleConnected = jest.fn();
            serialService.connectToBoard = jest.fn(() => Promise.resolve());

            await serialService.attemptConnectionToPort(port);

            expect(serialService.handleConnected).toHaveBeenCalled();
        });

        test('should call handleDisconnected', async () => {
            serialService.handleDisconnected = jest.fn();
            serialService.connectToBoard = jest.fn(() => Promise.reject());

            await serialService.attemptConnectionToPort(port);

            expect(serialService.handleDisconnected).toHaveBeenCalled();
        });
    });

    describe('#scanPorts', () => {
        test('should have called getAvailableSerialPorts and attemptConnectionToPorts', async () => {
            const ports = [{}];
            serialService.getAvailableSerialPorts = jest.fn(() => Promise.resolve(ports));
            serialService.attemptConnectionToPorts = jest.fn(() => Promise.resolve());

            await serialService.scanPorts();

            expect(serialService.getAvailableSerialPorts).toHaveBeenCalled();
            expect(serialService.attemptConnectionToPorts).toHaveBeenCalledWith(ports);
        });
    });

    describe('#getAvailableSerialPorts', () => {
        test('should return an array', async () => {
            const result = await serialService.getAvailableSerialPorts();

            expect(Array.isArray(result)).toEqual(true);
        });
    });

    describe('#filterPorts', () => {
        test.each([
            [1, [{ productId: 'test', comName: 'test' }], [], []],
            [0, [{ productId: undefined, comName: 'test' }], [], []],
            [1, [{ productId: 'test', comName: 'test' }], ['tost'], []],
            [0, [{ productId: 'test', comName: 'test' }], ['test'], []],
            [1, [{ productId: 'test', comName: 'test' }], [], ['tost']],
            [0, [{ productId: 'test', comName: 'test' }], [], ['test']],
        ])('should return %p element', (length: number, ports: any[], usedPorts: any[], unsupportedDevices: any[]) => {
            serialService.usedPorts = usedPorts;
            serialService.unsupportedDevices = unsupportedDevices;

            expect(serialService.filterPorts(ports).length).toEqual(length);
        });
    });

    describe('#attemptConnectionToPorts', () => {
        const ports = [
            {
                comName: '/dev/1',
            },
            {
                comName: '/dev/2',
            },
        ];

        test('should execute attemptConnectionToPorts twice', async () => {
            serialService.attemptConnectionToPort = jest.fn(() => Promise.resolve());

            await serialService.attemptConnectionToPorts(ports);

            expect(serialService.attemptConnectionToPort).toHaveBeenCalledTimes(ports.length);
            expect(serialService.usedPorts.length).toEqual(ports.length);
        });
    });

    describe('#closeServer', () => {
        test('should clear the portScanInterval and set it to undefined', () => {
            jest.useFakeTimers();
            serialService.closeServer();

            expect(clearInterval).toHaveBeenCalled();
            expect(serialService.portScanInterval).toBeUndefined();
            jest.useRealTimers();
        });
    });

    describe('#handleDisconnected', () => {
        const port = {
            comName: '/dev/1',
            manufacturer: '',
            serialNumber: '',
            pnpId: '',
            locationId: '',
            vendorId: '',
            productId: '',
        };

        beforeEach(() => {
            serialService.usedPorts = [port.comName];
        });

        test('should clear the port for a new device', () => {
            expect(serialService.usedPorts.length).toEqual(1);

            serialService.handleDisconnected(port, {});

            expect(serialService.usedPorts.length).toEqual(0);
        });

        test('should add the port to the list of unsupported devices', () => {
            expect(serialService.unsupportedDevices.length).toEqual(0);

            serialService.handleDisconnected(port);

            expect(serialService.usedPorts.length).toEqual(0);
            expect(serialService.unsupportedDevices.length).toEqual(1);
        });
    });

    describe('#handleConnected', () => {
        test('should log the new connection', () => {
            const board = {
                id: 'bacon',
                setIsSerialConnection: jest.fn(),
            };

            serialService.log.info = jest.fn();

            serialService.handleConnected(board);

            expect(serialService.log.info).toHaveBeenCalled();
            expect(board.setIsSerialConnection).toHaveBeenCalledWith(true);
        });
    });
});
