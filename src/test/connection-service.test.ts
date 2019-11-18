import ConnectionService from '../service/connection-service';
import Boards from '../model/boards';
import { Sequelize } from 'sequelize-typescript';
import Board from '../domain/board';
import { Socket } from 'net';
import FirmataResponseMock from './mocks/firmata-response.mock';
import FirmataBoardMock from './mocks/firmata-board.mock';
import BoardsMock from './mocks/boards.mock';

let connectionService: any;
let mockFirmataBoard: FirmataBoardMock;
let boardModel: any;
let sequelize: Sequelize;
let mockSocket: Socket;
let firmataResponseMock: FirmataResponseMock;

console.warn = () => {};

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([Board]);
});

beforeEach(() => {
    boardModel = new BoardsMock();
    connectionService = new ConnectionService(boardModel);
    mockSocket = new Socket();
    mockFirmataBoard = new FirmataBoardMock(mockSocket);

    firmataResponseMock = new FirmataResponseMock(mockSocket);
});

describe('ConnectionService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(connectionService).toBeDefined();
            expect(connectionService.model).toBeDefined();
        });
    });

    describe('#handleConnectionEstablished', () => {
        test('should return board and pass it to callback method', async () => {
            // @ts-ignore
            const board = new Board(undefined, undefined, mockFirmataBoard);
            board.id = 'bacon';
            const resolve = jest.fn();

            // @ts-ignore
            const result = await connectionService.handleConnectionEstablished(board, resolve);

            expect(result).toEqual(Board.toDiscrete(board));
            expect(boardModel.addBoard).toHaveBeenCalledWith(board);
            expect(resolve).toHaveBeenCalled();
        });
    });

    describe('#handleConnectionTimeout', () => {
        test('should call removeAllListeners, reject callback and log warning', () => {
            const reject = jest.fn();
            connectionService.log.warn = jest.fn();

            connectionService.handleConnectionTimeout(mockFirmataBoard, reject);

            expect(mockFirmataBoard.removeAllListeners).toHaveBeenCalled();
            expect(reject).toHaveBeenCalled();
            expect(connectionService.log.warn).toHaveBeenCalledWith('Timeout while connecting to device.');
        });
    });

    describe('#connectToBoard', () => {
        test('should connect successfully', done => {
            jest.useFakeTimers();

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

            connectionService.connectToBoard(mockSocket).then(() => {
                expect(boardModel.addBoard).toHaveBeenCalled();
                done();
            });

            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        test("should run handleConnectionTimeout method when a connection can't be made", done => {
            jest.useFakeTimers();

            connectionService.handleConnectionTimeout = jest.fn((firmataBoard, reject) => {
                reject();
            });

            // @ts-ignore
            mockSocket.write = (data: Buffer, cb: () => {}) => {
                cb();
            };

            connectionService.connectToBoard(mockSocket).catch(() => {
                expect(connectionService.handleConnectionTimeout).toHaveBeenCalled();
                done();
            });

            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        test('should reject when an error occurs during connecting', done => {
            jest.useFakeTimers();

            connectionService.handleDisconnectEvent = jest.fn();

            connectionService.connectToBoard(mockSocket).catch(board => {
                expect(board).toBeDefined();
                expect('id' in board).toEqual(true);
                expect(connectionService.handleDisconnectEvent).not.toHaveBeenCalled();
                done();
            });

            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });
    });

    describe('disconnect event listener', () => {
        test("should run disconnect callback method and handleDisconnectEvent handler when a connection can't be made", () => {
            connectionService.handleDisconnectEvent = jest.fn();

            connectionService.connectToBoard(mockSocket);
            mockSocket.emit('close', { disconnect: true, disconnected: true });

            expect(connectionService.handleDisconnectEvent).toHaveBeenCalled();
        });
    });

    describe('#handleDisconnectEvent', () => {
        test("should run disconnectBoard method when the service can't connect", () => {
            const board = new Board();
            board.id = 'bacon';
            const reject = jest.fn();

            // @ts-ignore
            connectionService.log.debug = jest.fn();

            connectionService.handleDisconnectEvent(board, reject);

            expect(connectionService.model.disconnectBoard).toHaveBeenCalledWith(board.id);
            expect(connectionService.log.debug).toHaveBeenCalledWith('Disconnect event received from board.');
            expect(reject).toHaveBeenCalledWith(board);
        });
    });

    describe('handleUpdateEvent', () => {
        test('should run updateBoard method of model when an update event was received', () => {
            const board = Board.toDiscrete(new Board());

            connectionService.handleUpdateEvent(board);

            expect(connectionService.model.updateBoard).toHaveBeenCalledWith(board);
        });
    });
});
