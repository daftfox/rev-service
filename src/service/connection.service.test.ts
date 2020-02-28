import { CONNECTION_TIMEOUT, ConnectionService } from './index';
import { boardMock, dataValuesMock, discreteBoardMock } from '../domain/board/base/__mocks__/board.model';
import { Socket } from 'net';
import { LoggerService } from './logger.service';
import { Board, FirmataBoard } from '../domain/board/base';
import { errorMock } from '../domain/board/base/__mocks__/firmata-board.model';
import { container } from 'tsyringe';
jest.mock('../domain/board/base/firmata-board.model');
jest.mock('../service/board.service');
jest.mock('./logger.service');
jest.mock('firmata');

let service: ConnectionService;
let socketMock: Socket;
let firmataBoardMock: FirmataBoard;

const properties = {
    model: 'model',
    handleConnectionEstablished: 'handleConnectionEstablished',
    handleConnectionTimeout: 'handleConnectionTimeout',
    namespace: 'namespace',
    connectToBoard: 'connectToBoard',
    handleDisconnectEvent: 'handleDisconnectEvent',
    handleUpdateEvent: 'handleUpdateEvent',
};

beforeEach(() => {
    service = new ConnectionService();
    socketMock = new Socket();
    firmataBoardMock = new FirmataBoard(socketMock);
});

describe('ConnectionService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(service).toBeDefined();
            expect(service[properties.model]).toBeDefined();
        });
    });

    describe('#handleConnectionEstablished', () => {
        test('should return board and pass it to callback method', async () => {
            const dataValues = boardMock.toDiscrete();

            await service[properties.handleConnectionEstablished](dataValues, firmataBoardMock);

            expect(service[properties.model].addBoard).toHaveBeenCalledWith(dataValues, firmataBoardMock);
        });
    });

    describe('#handleConnectionTimeout', () => {
        test('should call removeAllListeners, reject callback and log warning', () => {
            service[properties.handleConnectionTimeout](firmataBoardMock);

            expect(firmataBoardMock.removeAllListeners).toHaveBeenCalled();
            expect(LoggerService.warn).toHaveBeenCalledWith(
                'Timeout while connecting to device.',
                service[properties.namespace],
            );
        });
    });

    describe('#connectToBoard', () => {
        // @FIXME: somehow breaks the next test
        xtest('should reject and log on error', async done => {
            FirmataBoard['postError'] = true;

            try {
                await service[properties.connectToBoard](socketMock);
            } catch (error) {
                expect(LoggerService.debug).toHaveBeenCalledWith(errorMock.message);
                done();
            }
        });

        test('should connect successfully', async done => {
            const spyConnection = spyOn<any>(service, 'handleConnectionEstablished');
            const spyUpdate = spyOn<any>(service, 'handleUpdateEvent');

            FirmataBoard['postUpdate'] = true;
            FirmataBoard['postFirmwareUpdate'] = true;
            FirmataBoard['postReady'] = true;

            try {
                await service[properties.connectToBoard](socketMock);
                expect(service[properties.handleConnectionEstablished]).toHaveBeenCalled();
                expect(spyConnection.calls.argsFor(0)[0]).toEqual(dataValuesMock);
                expect(spyUpdate).toHaveBeenCalledWith(discreteBoardMock);
                done();
            } catch (error) {
                expect(spyUpdate).toHaveBeenCalledWith(discreteBoardMock);
            }
        });

        test('should timeout if connection could not be made within ten seconds', done => {
            jest.useFakeTimers();
            const spy = spyOn<any>(service, 'handleConnectionTimeout');

            service[properties.connectToBoard](socketMock).catch(_ => {
                expect(spy).toHaveBeenCalled();
                done();
            });

            jest.runOnlyPendingTimers();

            jest.useRealTimers();
        });
    });

    describe('#handleDisconnectEvent', () => {
        test("should run disconnectBoard method when the service can't connect", () => {
            const reject = jest.fn();

            service[properties.handleDisconnectEvent](boardMock.id, reject);

            expect(service[properties.model].disconnectBoard).toHaveBeenCalledWith(boardMock.id);
            expect(LoggerService.debug).toHaveBeenCalledWith(
                'Disconnect event received from board.',
                service[properties.namespace],
            );
            expect(reject).toHaveBeenCalledWith(boardMock.id);
        });
    });

    describe('#handleUpdateEvent', () => {
        test('should run updateOnlineBoard method of model when an update event was received', () => {
            service[properties.handleUpdateEvent](dataValuesMock);

            expect(service[properties.model].updateBoard).toHaveBeenCalledWith(dataValuesMock);
        });
    });
});
