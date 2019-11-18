import Boards from '../model/boards';
import { Sequelize } from 'sequelize-typescript';
import Board, { IDLE } from '../domain/board';
import BoardMock from './mocks/board.mock';
import AvailableTypes from '../domain/available-types';
import FirmataBoardMock from './mocks/firmata-board.mock';
import DatabaseService from '../service/database-service';
import NotFound from '../domain/web-socket-message/error/not-found';
import BadRequest from '../domain/web-socket-message/error/bad-request';
import { SupportedBoards } from '../domain/supported-boards';
import ICommand from '../domain/interface/command';
import CommandUnavailableError from '../error/command-unavailable';
import blink from '../domain/programs/blink';
import Conflict from '../domain/web-socket-message/error/conflict';
import MethodNotAllowed from '../domain/web-socket-message/error/method-not-allowed';
import Program from '../domain/program';

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
    debug: false,
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

    describe('#instantiateNewBoard', () => {
        test.each([
            [new BoardMock('bacon', 'eggs', AvailableTypes.BOARD), 'toggleLED'],
            [new BoardMock('bacon', 'eggs', AvailableTypes.MAJORTOM), 'setDTC'],
            [new BoardMock('bacon', 'eggs', AvailableTypes.LEDCONTROLLER), 'kitt'],
        ])('should create new instance of corresponding board types', (board, expectedProperty) => {
            // @ts-ignore
            const newBoard = Boards.instantiateNewBoard(board);

            expect(expectedProperty in newBoard).toEqual(true);
        });
    });

    describe('#findOrBuildBoard', () => {
        test('should return a fresh new instance of a board', () => {
            // @ts-ignore
            return Boards.findOrBuildBoard('bacon', AvailableTypes.BOARD).then(newBoard => {
                expect(newBoard.isNewRecord).toEqual(true);
                expect(newBoard).toBeDefined();
            });
        });

        test('should return an existing instance of a board from the database', () => {
            const newBoard = new Board();
            newBoard.save();

            // @ts-ignore
            return Boards.findOrBuildBoard(newBoard.id, AvailableTypes.BOARD).then(existingBoard => {
                expect(existingBoard.isNewRecord).toEqual(false);
            });
        });
    });

    describe('#synchronise', () => {
        test('should retrieve existing boards from the database', () => {
            const newBoard = new Board();
            newBoard.save();

            return boards.synchronise().then(() => {
                expect(boards._boards.length).toEqual(1);
            });
        });
    });

    describe('#getBoards', () => {
        test('should return an array of IBoard objects', () => {
            boards._boards.push(new Board());
            const result = boards.boards;

            expect(Array.isArray(result)).toEqual(true);
            expect(result.length).toEqual(1);
        });
    });

    describe('#getDiscreteBoardById', () => {
        let board;

        beforeEach(async () => {
            board = new Board();
            board.id = 'bacon';
            board.name = 'eggs';
            board.architecture = SupportedBoards.ARDUINO_UNO;
            await board.save();
            boards._boards = [board];
        });

        test('should return an object of type IBoard', () => {
            const discreteBoard = boards.getDiscreteBoardById(board.id);
            expect(discreteBoard.id).toEqual(board.id);
        });
    });

    describe('#getBoardById', () => {
        let board;

        beforeEach(async () => {
            board = new Board();
            board.id = 'bacon';
            board.name = 'eggs';
            board.architecture = SupportedBoards.ARDUINO_UNO;
            await board.save();
            boards._boards = [board];
        });

        describe('happy flows', () => {
            test('should return an object of type IBoard', () => {
                const discreteBoard = boards.getBoardById(board.id);
                expect(discreteBoard.id).toEqual(board.id);
            });
        });

        describe('exception flows', () => {
            test('should throw error', () => {
                const boardId = 'omelettedufromage';
                const getDiscreteBoardByIdError = () => {
                    boards.getDiscreteBoardById(boardId);
                };

                expect(getDiscreteBoardByIdError).toThrowError(
                    new NotFound(`Board with id ${boardId} could not be found.`),
                );
            });
        });
    });

    describe('#addBoard', () => {
        describe('happy flows', () => {
            test('should instantiate a new board and add it to the database', () => {
                // @ts-ignore
                Boards.log.debug = jest.fn();
                boards.emit = jest.fn();
                const newBoard = new Board();
                newBoard.id = 'bacon';
                const discreteBoard = Board.toDiscrete(newBoard);

                return boards.addBoard(newBoard).then(_board => {
                    expect(_board).toBeDefined();
                    expect(boards._boards.length).toEqual(1);
                    expect(boards.emit).toHaveBeenCalledWith('connected', discreteBoard, true);

                    // @ts-ignore
                    expect(Boards.log.debug).toHaveBeenCalled();
                });
            });

            test('should return an instance of an existing board and replace the cached board', async () => {
                const board = new Board();
                board.id = 'bacon';
                await board.save();
                boards._boards = [board];
                boards.emit = jest.fn();

                const updatedBoard = Object.assign(new Board(), board);
                updatedBoard.lastUpdateReceived = '2019-11-16T03:55:34+00:00';

                const discreteBoard = Board.toDiscrete(updatedBoard);

                return boards.addBoard(updatedBoard).then(_board => {
                    expect(_board).toBeDefined();
                    expect(_board.lastUpdateReceived).toEqual(updatedBoard.lastUpdateReceived);
                    expect(boards._boards.length).toEqual(1);
                    expect(boards.emit).toHaveBeenCalledWith('connected', discreteBoard, false);
                });
            });
        });
    });

    describe('#deleteBoard', () => {
        test('should remove a board from the database', () => {
            // @ts-ignore
            Boards.log.debug = jest.fn();
            const newBoard = new Board();
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

    describe('#disconnectBoard', () => {
        describe('happy flows', () => {
            test('should disconnect a board', () => {
                // @ts-ignore
                Boards.log.debug = jest.fn();
                const newBoard = new Board();
                newBoard.id = 'bacon';
                newBoard.save();
                boards.emit = jest.fn();
                boards._boards = [newBoard];
                newBoard.disconnect = jest.fn();
                newBoard.save = jest.fn();

                boards.disconnectBoard(newBoard.id);

                expect(boards.emit).toHaveBeenCalledWith('disconnected', Board.toDiscrete(newBoard));
                expect(newBoard.disconnect).toHaveBeenCalled();
                expect(newBoard.save).toHaveBeenCalled();

                // @ts-ignore
                expect(Boards.log.debug).toHaveBeenCalled();
            });
        });

        describe('exception flows', () => {
            test('should throw a not found error', () => {
                const boardId = 'berd';
                const disconnectBoardError = () => {
                    boards.disconnectBoard(boardId);
                };

                expect(disconnectBoardError).toThrowError(new NotFound(`Board with id ${boardId} could not be found.`));
            });
        });
    });

    describe('#updateBoard', () => {
        let board: Board;

        beforeEach(async () => {
            board = new Board();
            board.id = 'bacon';
            board.name = 'eggs';
            board.architecture = SupportedBoards.ARDUINO_UNO;
            await board.save();
            boards._boards = [board];
        });

        describe('happy flows', () => {
            test('should update the board with the new name', async () => {
                const boardUpdates = new Board();
                boardUpdates.id = 'bacon';
                boardUpdates.name = 'omelette du fromage';

                await boards.updateBoard(Board.toDiscrete(boardUpdates));

                expect(boards.getBoardById(boardUpdates.id).name).toEqual(boardUpdates.name);
            });

            test('should update the board with the new architecture', async () => {
                const boardUpdates = new Board();
                boardUpdates.id = 'bacon';
                boardUpdates.architecture = SupportedBoards.ESP_8266;

                await boards.updateBoard(Board.toDiscrete(boardUpdates));

                expect(board.architecture).toEqual(boardUpdates.architecture);
            });

            test('should update the board with the new type', async () => {
                const boardUpdates = new Board();
                boardUpdates.id = 'bacon';
                boardUpdates.type = AvailableTypes.LEDCONTROLLER;

                await boards.updateBoard(Board.toDiscrete(boardUpdates));

                expect(board.type).toEqual(boardUpdates.type);
            });

            test('should clear all timers when updating online board with the new type', async () => {
                board = new Board();
                board.id = 'fromage';
                board.online = true;
                board.clearAllTimers = jest.fn();
                await board.save();
                boards._boards = [board];

                const boardUpdates = new Board();
                boardUpdates.id = 'fromage';
                boardUpdates.type = AvailableTypes.LEDCONTROLLER;

                await boards.updateBoard(Board.toDiscrete(boardUpdates));

                expect(board.clearAllTimers).toHaveBeenCalled();
            });
        });

        describe('exception flows', () => {
            test('should throw an error', async () => {
                board.type = 'Bacon';

                const updateBoardError = async () => {
                    await boards.updateBoard(board);
                };

                const expectedError = new BadRequest(
                    `Type 'Bacon' is not a valid type. Valid types are${Object.values(AvailableTypes).map(
                        type => ` '${type}'`,
                    )}.`,
                );

                await expect(updateBoardError()).rejects.toThrowError(expectedError);
            });
        });
    });

    describe('#executeActionOnBoard', () => {
        let board: Board;

        beforeEach(async () => {
            board = new Board();
            board.id = 'bacon';
            board.name = 'eggs';
            board.online = true;
            await board.save();
            boards._boards = [board];
        });

        describe('happy flows', () => {
            test.each([
                [
                    {
                        action: 'TOGGLELED',
                    },
                    {
                        action: 'SETPINVALUE',
                        parameters: ['1', '128'],
                    },
                ],
            ])('should execute the action', async (command: ICommand) => {
                board.executeAction = jest.fn();

                await boards.executeActionOnBoard(board.id, command);

                expect(board.executeAction).toHaveBeenCalledWith(command.action, command.parameters);
            });
        });

        describe('exception flows', () => {
            test('should throw an error if the action does not exist', () => {
                const command: ICommand = {
                    action: 'FROMAGE',
                };

                const executeActionOnBoardError = async () => {
                    await boards.executeActionOnBoard(board.id, command);
                };

                expect(executeActionOnBoardError()).rejects.toThrowError(
                    new CommandUnavailableError(`'${command.action}' is not a valid action for this board.`),
                );
            });

            test('should throw an error if the board is offline', () => {
                board.online = false;
                const command: ICommand = {
                    action: 'TOGGLELED',
                };

                const executeActionOnBoardError = async () => {
                    await boards.executeActionOnBoard(board.id, command);
                };

                expect(executeActionOnBoardError()).rejects.toThrowError(
                    new CommandUnavailableError(`Unable to execute command on this board since it is not online.`),
                );
            });
        });
    });

    describe('#stopProgram', () => {
        test("should set the board's current program to IDLE", () => {
            const board = new Board();
            board.id = 'bacon';
            board.currentProgram = 'eggs';
            boards._boards = [board];

            boards.stopProgram(board.id);

            expect(board.currentProgram).toEqual(IDLE);
        });
    });

    describe('#executeProgramOnBoard', () => {
        let board: Board;

        beforeEach(async () => {
            board = new Board();
            board.id = 'bacon';
            board.name = 'eggs';
            board.online = true;
            await board.save();
            boards._boards = [board];
            boards.runProgram = jest.fn(() => Promise.resolve());
        });

        describe('happy flows', () => {
            test('should run the program once', async () => {
                const boardClone = Object.assign(Object.create(Object.getPrototypeOf(board)), board);
                boardClone.currentProgram = blink.name;

                await boards.executeProgramOnBoard(board.id, blink);

                expect(boards.runProgram).toHaveBeenCalledTimes(1);
                expect(boards.runProgram).toHaveBeenCalledWith(Board.toDiscrete(boardClone), blink);
            });

            test('should run the program thrice', async () => {
                await boards.executeProgramOnBoard(board.id, blink, 3);

                expect(boards.runProgram).toHaveBeenCalledTimes(3);
            });

            // fixme: the indefinite part can't be tested
            xtest('should run the program indefinitely', done => {
                boards.executeProgramOnBoard(board.id, blink, -1);

                setTimeout(() => {
                    boards.stopProgram(board.id);
                    expect(board.currentProgram).toEqual(blink.name);
                    expect(boards.runProgram).toHaveBeenCalledTimes(1);
                    done();
                }, 10);
            });
        });

        describe('exception flows', () => {
            test('should return an error when the board is not idle', async () => {
                board.currentProgram = 'eggs';

                const executeProgramOnBoardError = async () => {
                    await boards.executeProgramOnBoard(board.id, blink);
                };

                await expect(executeProgramOnBoardError()).rejects.toThrowError(
                    new Conflict(
                        `Board with id ${board.id} is already running a program (${board.currentProgram}). Stop the currently running program or wait for it to finish.`,
                    ),
                );
            });

            test("should return an error if the program isn't compatible with the board", async () => {
                board.currentProgram = IDLE;
                // const blinkForOtherType = Object.assign({}, blink);

                blink.deviceType = 'OtherBoardType';

                const executeProgramOnBoardError = async () => {
                    await boards.executeProgramOnBoard(board.id, blink);
                };

                await expect(executeProgramOnBoardError()).rejects.toThrowError(
                    new MethodNotAllowed(
                        `The program ${blink.name} cannot be run on board with id ${board.id}, because it is of the wrong type. Program ${blink.name} can only be run on devices of type ${blink.deviceType}.`,
                    ),
                );
            });
        });
    });

    describe('#createAndPersistBoard', () => {
        test('should create a new instance of the board parameter if type doesnt match constructor name', async () => {
            let board = new Board();
            board.type = 'LedController';

            board = await boards.createAndPersistBoard(board);

            expect(board.type).toEqual(board.type);
        });
    });

    describe('#runProgram', () => {
        test('should run the program', async () => {
            const board = new Board();
            board.id = 'bacon';
            board.currentProgram = blink.name;
            boards.executeActionOnBoard = jest.fn(() => Promise.resolve());

            await boards.runProgram(Board.toDiscrete(board), blink);

            expect(boards.executeActionOnBoard).toHaveBeenCalledTimes(blink.commands.length);
            expect(boards.executeActionOnBoard).toHaveBeenLastCalledWith(
                board.id,
                blink.commands[blink.commands.length - 1],
            );
        });

        test('should stop running the program', async () => {
            const board = new Board();
            board.id = 'bacon';
            board.currentProgram = IDLE;
            boards.executeActionOnBoard = jest.fn(() => Promise.resolve());

            await boards.runProgram(Board.toDiscrete(board), blink);

            expect(boards.executeActionOnBoard).toHaveBeenCalledTimes(0);
        });
    });
});

describe('', () => {});