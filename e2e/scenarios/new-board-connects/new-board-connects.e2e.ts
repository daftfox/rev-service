import { MainController } from '../../../src/controller';
import { BoardMock } from '../../mocks/board.mock';
import { Board } from '../../../src/domain/board/base';
import { LoggerService } from '../../../src/service/logger.service';
import { connection as WebSocketConnection, client as WebSocketClient } from 'websocket';
import {
    ANALOG_MAPPING_BYTE_ARRAY_BUFFER,
    CAPABILITIES_BYTE_ARRAY_BUFFER,
    MOCK_SERIAL_PORT_PATH,
    VERSION_BYTE_ARRAY_BUFFER,
    WEB_SOCKET_URL,
} from '../../mocks/constants';
import * as SerialPort from 'serialport';
import * as MockBinding from '@serialport/binding-mock';
jest.mock('../../../src/service/configuration.service');

let app: MainController;
let boardMock: BoardMock;
let webSocketClient: WebSocketClient;
const webSocketMessageCapture = jest.fn(val => console.log);

beforeAll(async () => {
    app = new MainController();
    await app.startAllServices();

    webSocketClient = new WebSocketClient();
    webSocketClient.connect(WEB_SOCKET_URL);
    webSocketClient.on('connect', (connection: WebSocketConnection) => {
        connection.on('message', webSocketMessageCapture);
    });
});

afterAll(async () => {
    await MainController.stopServices();
    boardMock.close();
});

describe('A new board attempts to connect over ethernet', () => {
    test('A successful connection should have been made', done => {
        const spy = spyOn(LoggerService, 'info').and.callFake(() => {
            const mostRecentCallArguments = spy.calls.mostRecent().args.join();

            expect(mostRecentCallArguments).toContain('Device');
            expect(mostRecentCallArguments).toContain('connected.');
            done();
        });

        boardMock = new BoardMock(true);
    });

    test('The new board should have been added to the database', () => {
        return Board.findAll().then((boards: Board[]) => {
            expect(boards[0].id).toEqual('MajorTom');
        });
    });

    test('The new board should have been broadcast to all connected web socket clients', () => {
        const stringifiedMessage = JSON.stringify(webSocketMessageCapture.mock.calls[1][0]);
        expect(stringifiedMessage).toContain('NEW');
    });
});

describe('A new board attempts to connect over a serial connection', () => {
    xtest('trying out virtual serial port', done => {
        // @ts-ignore
        SerialPort.Binding = MockBinding;
        MockBinding.createPort(MOCK_SERIAL_PORT_PATH, { echo: true, record: true, readyData: Buffer.from([]) });

        const port = new SerialPort(MOCK_SERIAL_PORT_PATH, { autoOpen: false });
        port.on('data', console.log);

        // setTimeout(() => {
        //     port.open(console.log);
        // }, 3000);

        setTimeout(() => {
            port.write(VERSION_BYTE_ARRAY_BUFFER);
        }, 3500);

        setTimeout(() => {
            port.write(CAPABILITIES_BYTE_ARRAY_BUFFER);
        }, 3800);

        setTimeout(() => {
            port.write(ANALOG_MAPPING_BYTE_ARRAY_BUFFER);
        }, 4000);

        setTimeout(done, 10000);
    });
});
