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
    test('A succesful connection should be made', async done => {
        boardMock = new BoardMock();

        const spy = spyOn(LoggerService, 'info').and.callFake(() => {
            const mostRecentCall = spy.calls.mostRecent();
            expect(mostRecentCall.args.join()).toContain(
                'Device \u001b[38;5;39m\u001b[1mMajorTom\u001b[22m\u001b[39m connected.',
            );
            done();
        });
    });

    test('The new board should have been added to the database', () => {
        return Board.findAll().then((boards: Board[]) => {
            expect(boards[0].id).toEqual('MajorTom');
        });
    });
});
