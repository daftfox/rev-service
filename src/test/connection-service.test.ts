import ConnectionService from '../service/connection-service';
import Boards from '../model/boards';
import { Sequelize } from 'sequelize-typescript';
import Board from '../domain/board';
import { Socket } from 'net';

let connectionService: any;
let boardModel: any;
let sequelize: Sequelize;
let mockSocket: Socket;

const versionByteArrayBuffer = Buffer.from([
    0xf9,
    0x02,
    0x05,
    0xf0,
    0x79,
    0x02,
    0x05,
    0x4d,
    0x00,
    0x61,
    0x00,
    0x6a,
    0x00,
    0x6f,
    0x00,
    0x72,
    0x00,
    0x54,
    0x00,
    0x6f,
    0x00,
    0x6d,
    0x00,
    0x2e,
    0x00,
    0x69,
    0x00,
    0x6e,
    0x00,
    0x6f,
    0x00,
    0xf7,
]);
const capabilitiesByteArrayBuffer = Buffer.from([
    0xf0,
    0x6c,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x06,
    0x01,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x06,
    0x01,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x00,
    0x01,
    0x0b,
    0x01,
    0x01,
    0x01,
    0x03,
    0x0a,
    0x04,
    0x0e,
    0x7f,
    0x02,
    0x0a,
    0x7f,
    0xf7,
]);
const analogMappingByteArrayBuffer = Buffer.from([
    0xf0,
    0x6a,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x00,
    0xf7,
]);

const reportVersion = () => {
    mockSocket.emit('data', versionByteArrayBuffer);
};

const reportCapabilities = () => {
    mockSocket.emit('data', capabilitiesByteArrayBuffer);
};

const reportAnalogMapping = () => {
    mockSocket.emit('data', analogMappingByteArrayBuffer);
};

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([Board]);
});

afterAll(() => {
    mockSocket.emit('close', { disconnect: true, disconnected: true });
});

beforeEach(() => {
    boardModel = new Boards();
    boardModel.addBoard = jest.fn((id, type, firmataBoard, serialConnection) => ({ id, name: 'berd' }));
    connectionService = new ConnectionService(boardModel);
    mockSocket = new Socket();
});

// todo: refactor
describe('ConnectionService:', () => {
    test('is instantiated', () => {
        expect(connectionService).toBeDefined();
        expect(connectionService.model).toBeDefined();
    });

    test('.connectToBoard()', done => {
        const connected = board => {
            expect(boardModel.addBoard).toHaveBeenCalled();
            done();
        };

        // @ts-ignore
        mockSocket.write = (data: Buffer, cb: () => {}) => {
            if (data[0] === 0xf9) {
                reportVersion();
            } else if (data[0] === 0xf0 && data[1] === 0x6b) {
                reportCapabilities();
            } else if (data[0] === 0xf0 && data[1] === 0x69) {
                reportAnalogMapping();
            }
            cb();
        };

        connectionService.connectToBoard(mockSocket, false, connected, () => {});
    });
});
