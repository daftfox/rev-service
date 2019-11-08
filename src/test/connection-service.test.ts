import ConnectionService from '../service/connection-service';
import Boards from '../model/boards';
import { Sequelize } from 'sequelize-typescript';
import Board from '../domain/board';
import { Socket } from 'net';
import FirmataResponseMock from './mocks/firmata-response.mock';
import FirmataBoardMock from './mocks/firmata-board.mock';

let connectionService: any;
let mockFirmataBoard: FirmataBoardMock;
let boardModel: any;
let sequelize: Sequelize;
let mockSocket: Socket;
let firmataResponseMock: FirmataResponseMock;

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([Board]);
});

beforeEach(() => {
    boardModel = new Boards();
    boardModel.addBoard = jest.fn((id, type, firmataBoard, serialConnection) => ({ id, name: 'berd' }));
    connectionService = new ConnectionService(boardModel);
    mockSocket = new Socket();
    mockFirmataBoard = new FirmataBoardMock(mockSocket);

    firmataResponseMock = new FirmataResponseMock(mockSocket);
});

// todo: refactor
describe('ConnectionService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(connectionService).toBeDefined();
            expect(connectionService.model).toBeDefined();
        });
    });

    describe('getBoardType', () => {
        test("should return 'bacon'", () => {
            // @ts-ignore
            const result = ConnectionService.getBoardType(mockFirmataBoard);

            expect(result).toEqual('bacon');
        });
    });

    describe('getBoardId', () => {
        test("should return 'eggs'", () => {
            // @ts-ignore
            const result = ConnectionService.getBoardId(mockFirmataBoard);

            expect(result).toEqual('eggs');
        });
    });

    describe('connectionEstablished', () => {
        test('should return board and pass it to callback method', async () => {
            const callback = jest.fn();

            // @ts-ignore
            const board = await connectionService.connectionEstablished(mockFirmataBoard, false, callback);

            expect(callback).toHaveBeenCalledWith(board);
        });
    });

    describe('connectionTimeout', () => {
        test('should call removeAllListeners, disconnected callback and log warning', () => {
            const disconnectedMock = jest.fn();
            connectionService.log.warn = jest.fn();

            connectionService.connectionTimeout(mockFirmataBoard, disconnectedMock);

            expect(mockFirmataBoard.removeAllListeners).toHaveBeenCalled();
            expect(disconnectedMock).toHaveBeenCalled();
            expect(connectionService.log.warn).toHaveBeenCalledWith('Timeout while connecting to device.');
        });
    });

    describe('connectToBoard', () => {
        test('should connect successfully', done => {
            const connected = board => {
                expect(boardModel.addBoard).toHaveBeenCalled();
                done();
            };

            // @ts-ignore
            mockSocket.write = (data: Buffer, cb: () => {}) => {
                if (data[0] === 0xf9) {
                    firmataResponseMock.reportVersion();
                } else if (data[0] === 0xf0 && data[1] === 0x6b) {
                    firmataResponseMock.reportCapabilities();
                } else if (data[0] === 0xf0 && data[1] === 0x69) {
                    firmataResponseMock.reportAnalogMapping();
                }
                cb();
            };

            connectionService.connectToBoard(mockSocket, false, connected, () => {});
        });

        test("should run disconnect callback method when a connection can't be made", async () => {
            const disconnected = jest.fn();
            connectionService.connectionTimeout = jest.fn();

            jest.useFakeTimers();

            connectionService.connectToBoard(mockSocket, false, () => {}, disconnected);
            jest.runAllTimers();

            expect(disconnected).toHaveBeenCalled();
            expect(connectionService.connectionTimeout).toHaveBeenCalled();
        });
    });

    describe('disconnect event listener', () => {
        test("should run disconnect callback method and handleDisconnectEvent handler when a connection can't be made", async () => {
            const disconnected = jest.fn();
            connectionService.handleDisconnectEvent = jest.fn();

            connectionService.connectToBoard(mockSocket, false, () => {}, disconnected);
            mockSocket.emit('close', { disconnect: true, disconnected: true });

            expect(disconnected).toHaveBeenCalled();
            expect(connectionService.handleDisconnectEvent).toHaveBeenCalled();
        });
    });

    describe('handleDisconnectEvent', () => {
        test("should run disconnectBoard method of model when the service can't connect", async () => {
            // @ts-ignore
            const boardId = ConnectionService.getBoardId(mockFirmataBoard);
            connectionService.model.disconnectBoard = jest.fn();
            connectionService.log.debug = jest.fn();

            connectionService.handleDisconnectEvent(mockFirmataBoard);

            expect(connectionService.model.disconnectBoard).toHaveBeenCalledWith(boardId);
            expect(connectionService.log.debug).toHaveBeenCalledWith('Disconnect event received from firmataboard.');
        });

        test('should only log disconnect event', async () => {
            connectionService.log.debug = jest.fn();

            connectionService.handleDisconnectEvent();

            expect(connectionService.log.debug).toHaveBeenCalledWith('Disconnect event received from firmataboard.');
        });
    });

    describe('handleUpdateEvent', () => {
        test('should run updateBoard method of model when an update event was received', async () => {
            const mockBoard = { name: 'berd' };
            connectionService.model.updateBoard = jest.fn();

            connectionService.handleUpdateEvent(mockBoard);

            expect(connectionService.model.updateBoard).toHaveBeenCalledWith(mockBoard);
        });
    });
});
