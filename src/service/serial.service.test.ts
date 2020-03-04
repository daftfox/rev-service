import { SerialService } from './index';
import { LoggerService } from './logger.service';
jest.mock('./logger.service');

let service: SerialService;

const properties = {
    portScanInterval: 'portScanInterval',
    scanPorts: 'scanPorts',
    handleConnected: 'handleConnected',
    handleDisconnected: 'handleDisconnected',
    connectToBoard: 'connectToBoard',
    getAvailableSerialPorts: 'getAvailableSerialPorts',
    attemptConnectionToPort: 'attemptConnectionToPort',
    attemptConnectionToPorts: 'attemptConnectionToPorts',
    usedPorts: 'usedPorts',
    unsupportedDevices: 'unsupportedDevices',
    filterPorts: 'filterPorts',
};

beforeEach(() => {
    service = new SerialService();
});

afterEach(async () => {
    service.closeServer();
});

describe('SerialService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(service).toBeDefined();
        });
    });

    describe('#listen', () => {
        test('should have logged an info message', () => {
            service.listen();

            expect(LoggerService.info).toHaveBeenCalled();
        });

        test('should have created an interval instance', () => {
            service.listen();

            expect(service[properties.portScanInterval]).toBeDefined();
        });

        test('should have called getAvailableSerialPorts and attemptConnectionToPorts', async () => {
            const spy = spyOn<any>(service, 'scanPorts');

            jest.useFakeTimers();
            service.listen();

            jest.advanceTimersByTime(20000);
            jest.useRealTimers();

            expect(spy).toHaveBeenCalledTimes(20);
        });
    });

    describe('#attemptConnectionToPort', () => {
        const port = { path: 'test' };

        test('should call handleConnected', async () => {
            const spyConnected = spyOn<any>(service, 'handleConnected');
            spyOn<any>(service, 'connectToBoard').and.returnValue(Promise.resolve());

            await service[properties.attemptConnectionToPort](port);

            expect(spyConnected).toHaveBeenCalled();
        });

        test('should call handleDisconnected', async () => {
            const spyDisconnected = spyOn<any>(service, 'handleDisconnected');
            spyOn<any>(service, 'connectToBoard').and.returnValue(Promise.reject());

            await service[properties.attemptConnectionToPort](port);

            expect(spyDisconnected).toHaveBeenCalled();
        });
    });

    describe('#scanPorts', () => {
        test('should have called getAvailableSerialPorts and attemptConnectionToPorts', async () => {
            const ports = [{}];
            const spyGetAvailableSerialPorts = spyOn<any>(service, 'getAvailableSerialPorts').and.returnValue(
                Promise.resolve(ports),
            );
            const spyAttemptConnectionToPorts = spyOn<any>(service, 'attemptConnectionToPorts').and.returnValue(
                Promise.resolve(),
            );

            await service[properties.scanPorts]();

            expect(spyGetAvailableSerialPorts).toHaveBeenCalled();
            expect(spyAttemptConnectionToPorts).toHaveBeenCalledWith(ports);
        });
    });

    describe('#getAvailableSerialPorts', () => {
        test('should return an array', async () => {
            const result = await service[properties.getAvailableSerialPorts]();

            expect(Array.isArray(result)).toEqual(true);
        });
    });

    describe('#filterPorts', () => {
        test.each([
            [1, [{ productId: 'test', path: 'test' }], [], []],
            [0, [{ productId: undefined, path: 'test' }], [], []],
            [1, [{ productId: 'test', path: 'test' }], ['tost'], []],
            [0, [{ productId: 'test', path: 'test' }], ['test'], []],
            [1, [{ productId: 'test', path: 'test' }], [], ['tost']],
            [0, [{ productId: 'test', path: 'test' }], [], ['test']],
        ])('should return %p element', (length: number, ports: any[], usedPorts: any[], unsupportedDevices: any[]) => {
            service[properties.usedPorts] = usedPorts;
            service[properties.unsupportedDevices] = unsupportedDevices;

            expect(service[properties.filterPorts](ports).length).toEqual(length);
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
            const spyAttemptConnectionToPort = spyOn<any>(service, 'attemptConnectionToPort').and.returnValue(
                Promise.resolve(),
            );

            await service[properties.attemptConnectionToPorts](ports);

            expect(spyAttemptConnectionToPort).toHaveBeenCalledTimes(ports.length);
            expect(service[properties.usedPorts].length).toEqual(ports.length);
        });
    });

    describe('#closeServer', () => {
        test('should clear the portScanInterval and set it to undefined', () => {
            const spy = spyOn(global, 'clearInterval');
            service.closeServer();

            expect(spy).toHaveBeenCalled();
            expect(service[properties.portScanInterval]).toBeUndefined();
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
            service[properties.usedPorts] = [port.comName];
        });

        test('should clear the port for a new device', () => {
            expect(service[properties.usedPorts].length).toEqual(1);

            service[properties.handleDisconnected](port, {});

            expect(service[properties.usedPorts].length).toEqual(0);
        });

        test('should add the port to the list of unsupported devices', () => {
            expect(service[properties.unsupportedDevices].length).toEqual(0);

            service[properties.handleDisconnected](port);

            expect(service[properties.usedPorts].length).toEqual(0);
            expect(service[properties.unsupportedDevices].length).toEqual(1);
        });
    });

    describe('#handleConnected', () => {
        test('should log the new connection', () => {
            const board = {
                id: 'bacon',
                setIsSerialConnection: jest.fn(),
            };

            service[properties.handleConnected](board);

            expect(LoggerService.info).toHaveBeenCalled();
            expect(board.setIsSerialConnection).toHaveBeenCalledWith(true);
        });
    });
});
