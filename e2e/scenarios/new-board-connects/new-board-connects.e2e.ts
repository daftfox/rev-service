import { MainController } from '../../../src/controller';
import { BoardMock } from '../../mocks/board.mock';
import { Board } from '../../../src/domain/board/base';
import { LoggerService } from '../../../src/service/logger.service';
jest.mock('../../../src/service/configuration.service');

let app: MainController;
let boardMock: BoardMock;

beforeAll(async () => {
    app = new MainController();
    await app.startAllServices();
});

afterAll(() => {
    MainController.stopServices();
    boardMock.close();
});

describe('A new board attempts to connect over ethernet', () => {
    test('A succesful connection should be made', done => {
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
});
