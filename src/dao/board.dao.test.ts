import { BoardDAO } from './board.dao';
import { Board } from '../domain/board/base/board.model';
import { AVAILABLE_EXTENSIONS_CLASSES, AVAILABLE_EXTENSIONS_KEYS } from '../domain/board/extension';
import { BuildOptions } from 'sequelize';
import { BoardTypeNotFoundError } from '../domain/error';
import { IBoardDataValues } from '../domain/board/interface/board-data-values.interface';
import { BoardDuplicateError } from '../domain/error/board-duplicate.error';
import {
    allBoardsMock,
    boardMock,
    dataValuesMock,
    idsMock,
    unknownDataValuesMock,
} from '../domain/board/base/__mocks__/board.model';
jest.mock('../domain/board/base/board.model');

let service: BoardDAO;
const properties = {
    create: 'create',
    persist: 'persist',
    createBoardInstance: 'createBoardInstance',
    exists: 'exists',
    destroy: 'destroy',
    getAll: 'getAll',
};

beforeEach(() => {
    service = new BoardDAO();
});

describe('BoardDAO', () => {
    describe('constructor', () => {
        test('should instantiate properly', async () => {
            expect(service).toBeDefined();
        });
    });

    describe('#save', () => {
        test('should call the board save method', async () => {
            await BoardDAO[properties.persist](boardMock);
            expect(boardMock.save).toHaveBeenCalled();
        });
    });

    describe('#create', () => {
        test('should call the instantiateNewBoard method', async () => {
            const spy = spyOn<any>(BoardDAO, 'instantiateNewBoard');
            await BoardDAO[properties.create](dataValuesMock);

            expect(spy).toHaveBeenCalledWith(dataValuesMock);
        });

        test('should throw a BoardDuplicateError', async () => {
            const id = 'eggs';
            const expectedError = new BoardDuplicateError(`Board with id ${id} already exists.`);

            spyOn(BoardDAO, 'exists').and.returnValue(true);

            try {
                await BoardDAO[properties.create]({ id, type: dataValuesMock.type });
            } catch (error) {
                expect(error).toEqual(expectedError);
            }
        });
    });

    describe('#instantiateNewBoard', () => {
        test('should call the createBoardInstance method', () => {
            const spy = spyOn(BoardDAO, 'createBoardInstance');

            BoardDAO['instantiateNewBoard'](dataValuesMock);

            expect(spy).toHaveBeenCalledWith(dataValuesMock);
        });
    });

    describe('#createBoardInstance', () => {
        test.each([
            [AVAILABLE_EXTENSIONS_KEYS.Board, AVAILABLE_EXTENSIONS_CLASSES.Board],
            [AVAILABLE_EXTENSIONS_KEYS.MajorTom, AVAILABLE_EXTENSIONS_CLASSES.MajorTom],
            [AVAILABLE_EXTENSIONS_KEYS.LedController, AVAILABLE_EXTENSIONS_CLASSES.LedController],
        ])(
            'should instantiate a board of type %p',
            (type: string, className: new (model?: any, buildOptions?: BuildOptions) => Board) => {
                const dataValues: IBoardDataValues = {
                    id: 'bacon',
                    type,
                };

                const result = BoardDAO[properties.createBoardInstance](dataValues);

                expect(result).toBeDefined();
                expect(result instanceof className).toEqual(true);
            },
        );

        test('should throw a BoardTypeNotFoundError', () => {
            const expectedError = new BoardTypeNotFoundError(
                `Type '${unknownDataValuesMock.type}' is not a valid type. Valid types are${Object.values(
                    AVAILABLE_EXTENSIONS_KEYS,
                ).map(availableExtension => ` '${availableExtension}'`)}`,
            );

            const instantiateBoardError = () => {
                return BoardDAO[properties.createBoardInstance](unknownDataValuesMock);
            };

            expect(instantiateBoardError).toThrowError(expectedError);
        });
    });

    describe('#getAll', () => {
        test('should return an array of all the boards in the database', async () => {
            const spy = spyOn(BoardDAO, 'createBoardInstance');

            const result = await BoardDAO[properties.getAll]();

            expect(result.length).toEqual(2);
            expect(Board.findAll).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledTimes(allBoardsMock.length);
        });
    });

    describe('#exists', () => {
        test('should return true for an existing board', async () => {
            const spy = spyOn(Board, 'findByPk').and.returnValue({});

            await BoardDAO[properties.exists](idsMock[0]);

            expect(spy).toHaveBeenCalled();
        });

        test('should return false for an nonexistent board', async () => {
            await expect(BoardDAO[properties.exists]('fromage')).resolves.toEqual(false);
        });
    });

    describe('#destroy', () => {
        test('should call the board destroy method and log the action', async () => {
            await BoardDAO[properties.destroy](boardMock);
        });
    });
});
