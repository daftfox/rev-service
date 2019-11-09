import Boards from '../model/boards';
import {Sequelize} from "sequelize-typescript";
import Board from "../domain/board";
import BoardMock from "./mocks/board.mock";
import AvailableTypes from "../domain/available-types";
import FirmataBoardMock from "./mocks/firmata-board.mock";
import DatabaseService from "../service/database-service";
import IBoard from "../domain/interface/board";
import NotFound from "../domain/web-socket-message/error/not-found";
import ServerError from "../domain/web-socket-message/error/server-error";
import BadRequest from "../domain/web-socket-message/error/bad-request";
import BoardArchitecture from "../domain/board-architecture";
import {SupportedBoards} from "../domain/supported-boards";

let boards: any;
let mockFirmataBoard: any;
let sequelize: Sequelize;
let databaseService: any;

console.info = () => {};

const databaseOptions = {
    schema: 'rev',
    host: 'localhost',
    port: 3306,
    username: '',
    password: '',
    dialect: 'sqlite',
    path: ':memory:',
    debug: undefined,
};

beforeEach(() => {
    boards = new Boards();
    mockFirmataBoard = new FirmataBoardMock();
    databaseService = new DatabaseService(databaseOptions);
    return databaseService.synchronise();
});


beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([Board]);
});

describe('Boards', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(boards).toBeDefined();
        });
    });

    describe('instantiateBoard', () => {
        test.each(
            [
                [new BoardMock('bacon', 'eggs', AvailableTypes.BOARD), 'toggleLED'],
                [new BoardMock('bacon', 'eggs', AvailableTypes.MAJORTOM), 'setDTC'],
                [new BoardMock('bacon', 'eggs', AvailableTypes.LEDCONTROLLER), 'kitt'],
            ]
        )('should create new instance of corresponding board types', ( board, expectedProperty ) => {
           // @ts-ignore
            const newBoard = Boards.instantiateBoard(board);

            expect(expectedProperty in newBoard).toEqual(true);
        });
    });

    describe('findOrBuildBoard', () => {
        test('should return a fresh new instance of a board', () => {
            // @ts-ignore
            return Boards.findOrBuildBoard( 'bacon', AvailableTypes.BOARD )
                .then( newBoard => {
                    expect(newBoard.isNewRecord).toEqual(true);
                    expect(newBoard).toBeDefined();
                });
        });

        test('should return an existing instance of a board from the database', () => {
            const newBoard = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
            newBoard.save();

            // @ts-ignore
            return Boards.findOrBuildBoard( newBoard.id, AvailableTypes.BOARD )
                .then( existingBoard => {
                    expect(existingBoard.isNewRecord).toEqual(false);
                });
        });
    });

    describe('synchronise', () => {
        test('should retrieve existing boards from the database', () => {
            const newBoard = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
            newBoard.save();

            return boards.synchronise()
                .then( () => {
                    expect(boards._boards.length).toEqual(1);
                    expect(boards._boards[0].id).toEqual(newBoard.id);
                } );
        });
    });

    describe('addBoardConnectedListener', () => {
        test('should add a listener method to the array of listeners', () => {
            const listener = (board: IBoard, newRecord: boolean) => {};

            boards.addBoardConnectedListener(listener);

            expect(boards.boardConnectedListeners.length).toEqual(1);
        });
    });

    describe('addBoardUpdatedListener', () => {
        test('should add a listener method to the array of listeners', () => {
            const listener = (board: IBoard) => {};

            boards.addBoardUpdatedListener(listener);

            expect(boards.boardUpdatedListeners.length).toEqual(1);
        });
    });

    describe('addBoardDisconnectedListener', () => {
        test('should add a listener method to the array of listeners', () => {
            const listener = (board: IBoard) => {};

            boards.addBoardDisconnectedListener(listener);

            expect(boards.boardDisconnectedListeners.length).toEqual(1);
        });
    });

    describe('getBoards', () => {
        test('should return an array of IBoard objects', () => {
            boards._boards.push(new Board(undefined, undefined, undefined, false, 'bacon'));
            const result = boards.boards;

            expect(Array.isArray(result)).toEqual(true);
            expect(result.length).toEqual(1);
        });
    });

    describe('getBoardById', () => {
        describe('happy flows', () => {
            test('should return an instance of IBoard', () => {
                boards._boards.push(new Board(undefined, undefined, undefined, false, 'bacon'));

                const result = boards.getBoardById('bacon');

                expect(result).toBeDefined();
            });
        });

        describe('exception flows', () => {
            test('should return an error', () => {
                const getBoardByIdError = () => {
                    boards.getBoardById('bacon');
                };

                expect(getBoardByIdError).toThrowError(new NotFound(`Board with id bacon could not be found.`));
            });
        });
    });

    describe('addBoard', () => {
        describe('happy flows', () => {
            test('should instantiate a new board and add it to the database', () => {
                // @ts-ignore
                Boards.log.debug = jest.fn();
                const mockListener = jest.fn();
                boards.boardConnectedListeners = [mockListener];

                const discreteBoard = Board.toDiscrete(new Board(undefined, undefined, undefined, false, 'eggs'));

                return boards.addBoard(discreteBoard.id, AvailableTypes.BOARD)
                    .then( board => {
                        expect(board).toBeDefined();
                        expect(board.id).toEqual(discreteBoard.id);
                        expect(boards._boards.length).toEqual(1);
                        expect(mockListener).toHaveBeenCalledWith(discreteBoard, true);

                        // @ts-ignore
                        expect(Boards.log.debug).toHaveBeenCalled();
                    } );
            });

            test('should return an instance of an existing board and replace the cached board', () => {
                const newBoard = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
                newBoard.save();
                boards._boards = [newBoard];

                const discreteBoard = Board.toDiscrete(new Board(undefined, undefined, undefined, false, 'omelette_du_fromage'));

                // @ts-ignore
                const mockListener = jest.fn();
                boards.boardConnectedListeners = [mockListener];

                return boards.addBoard(newBoard.id, AvailableTypes.BOARD)
                    .then( board => {
                        expect(board).toBeDefined();
                        expect(board.id).toEqual(newBoard.id);
                        expect(boards._boards.length).toEqual(1);
                        expect(mockListener).toHaveBeenCalledWith(discreteBoard, false);
                    } );
            });
        });
    });

    describe('deleteBoard', () => {
        test('should remove a board from the database', () => {
            // @ts-ignore
            Boards.log.debug = jest.fn();
            const newBoard = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
            newBoard.save();
            newBoard.destroy = jest.fn();
            boards._boards = [newBoard];
            boards.disconnectBoard = jest.fn();

            boards.deleteBoard(newBoard.id);

            expect(boards.disconnectBoard).toHaveBeenCalled();
            expect(newBoard.destroy).toHaveBeenCalled();

            // @ts-ignore
            expect(Boards.log.debug).toHaveBeenCalled();
        });
    });

    describe('disconnectBoard', () => {
        describe('happy flows', () => {
            test('should disconnect a board', () => {
                // @ts-ignore
                Boards.log.debug = jest.fn();
                const newBoard = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
                newBoard.save();
                boards._boards = [newBoard];
                newBoard.disconnect = jest.fn();
                newBoard.save = jest.fn();
                const mockListener = jest.fn();
                boards.boardDisconnectedListeners = [mockListener];

                boards.disconnectBoard(newBoard.id);

                expect(mockListener).toHaveBeenCalledWith(Board.toDiscrete(newBoard));
                expect(newBoard.disconnect).toHaveBeenCalled();
                expect(newBoard.save).toHaveBeenCalled();

                // @ts-ignore
                expect(Boards.log.debug).toHaveBeenCalled();
            });
        });

        describe('exception flows', () => {
            test('should throw a not found error', () => {
                const disconnectBoardError = () => {
                    boards.disconnectBoard('berd');
                };

                expect(disconnectBoardError).toThrowError(new NotFound('Board not found'));
            });
        });
    });

    describe('updateBoard', () => {
        let board: Board;

        beforeEach(() => {
            board = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
            board.name = 'eggs';
            board.architecture = SupportedBoards.ARDUINO_UNO;
            board.save();
            boards._boards = [board];
        });

        describe('happy flows', () => {
            test('should update the board with the new name', () => {
                const boardUpdates = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
                board.name = 'eggs';
                boardUpdates.name = 'bacon';

                boards.updateBoard(boardUpdates);

                expect(boards.getBoardById(boardUpdates.id).name).toEqual(boardUpdates.name);
            });

            test('should update the board with the new architecture', () => {
                const boardUpdates = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
                boardUpdates.architecture = SupportedBoards.ESP_8266;

                boards.updateBoard(boardUpdates, true);

                expect(board.architecture).toEqual(boardUpdates.architecture);
            });

            test('should update the board with the new type', () => {
                const boardUpdates = new Board(undefined, undefined, undefined, false, 'omelette_du_fromage');
                boardUpdates.type = AvailableTypes.LEDCONTROLLER;

                boards.updateBoard(boardUpdates, true);

                expect(board.type).toEqual(boardUpdates.type);
            });

            // todo: model needs refactoring before this can be tested
            // test('should clear all timers when updating online board with the new type', () => {
            //     board = new Board(undefined, undefined, undefined, false, 'fromage_cest_bien');
            //     board.online = true;
            //     board.clearAllTimers = jest.fn();
            //     board.save();
            //     boards._boards = [board];
            //
            //     const boardUpdates = new Board(undefined, undefined, undefined, false, 'fromage_cest_bien');
            //     boardUpdates.type = AvailableTypes.LEDCONTROLLER;
            //
            //     boards.updateBoard(boardUpdates);
            //
            //     expect(board.clearAllTimers).toHaveBeenCalled();
            // });
        });

        describe('exception flows', () => {
            test('should throw an error', () => {
                board.type = 'Bacon';

                const updateBoardError = () => {
                    boards.updateBoard(board);
                };

                const expectedError = new BadRequest(`Type 'Bacon' is not a valid type. Valid types are${Object.values(
                    AvailableTypes,
                ).map(type => ` '${type}'`)}.`);

                expect(updateBoardError).toThrowError(expectedError);
            });
        });
    });

    // todo finish tests
    describe('', () => {

    });
});
