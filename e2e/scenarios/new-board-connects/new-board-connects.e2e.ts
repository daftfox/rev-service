import { MainController } from '../../../src/controller';
import { BoardMock } from '../../mocks/board.mock';
import { Board } from '../../../src/domain/board/base';
import { LoggerService } from '../../../src/service/logger.service';
import { connection as WebSocketConnection, client as WebSocketClient } from 'websocket';
jest.mock('../../../src/service/configuration.service');

let app: MainController;
let boardMock: BoardMock;
let webSocketClient: WebSocketClient;
const webSocketMessageCapture = jest.fn(val => console.log);

beforeAll(async () => {
    app = new MainController();
    await app.startAllServices();

    webSocketClient = new WebSocketClient();
    webSocketClient.connect('ws://localhost:3001');
    webSocketClient.on('connect', (connection: WebSocketConnection) => {
        connection.on('message', webSocketMessageCapture);
    });
});

afterAll(() => {
    MainController.stopServices();
    boardMock.close();
});

describe('A new board attempts to connect over ethernet', () => {
    test('A succesful connection should have been made', done => {
        const spy = spyOn(LoggerService, 'info').and.callFake(() => {
            const mostRecentCallArguments = spy.calls.mostRecent().args.join();

            expect(mostRecentCallArguments).toContain('Device');
            expect(mostRecentCallArguments).toContain('connected.');
            done();
        });

        boardMock = new BoardMock();
    });

    test('The new board should have been added to the database', () => {
        return Board.findAll().then((boards: Board[]) => {
            expect(boards[0].id).toEqual('MajorTom');
        });
    });

    test('The new board should have been broadcasted to all connected web socket clients', () => {
        const stringifiedMessage = JSON.stringify(webSocketMessageCapture.mock.calls[1][0]);
        expect(stringifiedMessage).toContain('NEW');
    });
});
