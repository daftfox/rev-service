import { BoardService } from './index';
import { BoardNotFoundError } from '../domain/error';
import { BoardDAO } from '../dao/board.dao';
import { boardMock, dataValuesMock, discreteBoardMock, idsMock } from '../domain/board/base/__mocks__/board.model';
import { ServerError } from '../domain/error/server.error';
import { LoggerService } from './logger.service';
import { firmataBoardMockFactory } from '../domain/board/base/__mocks__/firmata-board.model';
jest.mock('../domain/board/base/firmata-board.model');
jest.mock('./logger.service');
jest.mock('../dao/board.dao');
jest.mock('../domain/board/base/board.model');
jest.mock('./configuration.service');

let service: BoardService;
const properties = {
    cache: 'cache',
    inCache: 'inCache',
    createAndPersistNewBoard: 'createAndPersistNewBoard',
    initialiseCachedBoard: 'initialiseCachedBoard',
    deleteBoard: 'deleteBoard',
    disconnectBoard: 'disconnectBoard',
    removeFromCache: 'removeFromCache',
    emit: 'emit',
    updateBoard: 'updateBoard',
    updateOnlineBoard: 'updateOnlineBoard',
    updateOfflineBoard: 'updateOfflineBoard',
    updateCachedBoard: 'updateCachedBoard',
    addBoardToCache: 'addBoardToCache',
    persistChanges: 'persistChanges',
    initialiseBoard: 'initialiseBoard',
};

beforeEach(() => {
    service = new BoardService();
    spyOn(service, 'emit');
});

const addBoardToCache = () => {
    service[properties.cache].push(boardMock);
};

describe('BoardService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(service).toBeDefined();
        });
    });

    describe('#inCache', () => {
        beforeEach(() => {
            addBoardToCache();
        });

        test.each([
            [0, dataValuesMock.id],
            [-1, 'unknown-board'],
        ])(
            'should return %p when checking if board with id %p exists in the cache',
            (expectedValue: number, boardId: string) => {
                expect(service[properties.inCache](boardId)).toEqual(expectedValue);
            },
        );
    });

    describe('#createAndPersistNewBoard', () => {
        test('should create a new board, persist it and attach firmataBoard object', async () => {
            const board = await BoardService[properties.createAndPersistNewBoard](
                dataValuesMock,
                firmataBoardMockFactory,
            );

            expect(BoardDAO.create).toHaveBeenCalled();
            expect(BoardDAO.persist).toHaveBeenCalled();
            expect(board.getFirmataBoard()).toEqual(firmataBoardMockFactory);
        });
    });

    describe('#updateCache', () => {
        test('should call the DAO getAll method', async () => {
            await service.updateCache();
            expect(BoardDAO.getAll).toHaveBeenCalled();
        });
    });

    describe('#getAllBoards', () => {
        test('should return an array of IBoard objects', () => {
            addBoardToCache();
            const result = service.getAllBoards();

            expect(Array.isArray(result)).toEqual(true);
            expect(result.length).toEqual(1);
        });
    });

    describe('#getBoardById', () => {
        test('should return an object of type IBoard', () => {
            addBoardToCache();

            const board = service.getBoardById(boardMock.id);
            expect(board.id).toEqual(boardMock.id);
        });

        test('should throw a BoardNotFoundError', () => {
            const boardId = 'unknown-board';
            const expectedError = new BoardNotFoundError(`Board with id ${boardId} could not be found.`);
            const getBoardByIdError = () => {
                return service.getBoardById(boardId);
            };

            expect(getBoardByIdError).toThrowError(expectedError);
        });
    });

    describe('#addBoard', () => {
        test('should add a new board to the cache', async () => {
            const createAndPersistSpy = spyOn<any>(BoardService, properties.createAndPersistNewBoard).and.callThrough();
            const initialiseCachedBoardSpy = spyOn<any>(service, properties.initialiseCachedBoard).and.callThrough();
            const firmataBoardMock = firmataBoardMockFactory();

            await service.addBoard(dataValuesMock, firmataBoardMock);

            expect(initialiseCachedBoardSpy).toHaveBeenCalledWith(dataValuesMock.id, firmataBoardMock);
            expect(createAndPersistSpy).toHaveBeenCalledWith(dataValuesMock, firmataBoardMock);
            expect(service.emit).toHaveBeenCalledWith('connected', discreteBoardMock, true);
        });

        test('should log a server error', async () => {
            spyOn<any>(service, properties.initialiseCachedBoard).and.callFake(() => {
                throw new Error();
            });
            const firmataBoardMock = firmataBoardMockFactory();

            try {
                await service.addBoard(dataValuesMock, firmataBoardMock);
            } catch (error) {
                expect(LoggerService.stack).toHaveBeenCalledWith(
                    new ServerError(`Board with id ${dataValuesMock.id} could not be added due to an unknown error.`),
                );
            }
        });
    });

    describe('#deleteBoard', () => {
        test('should disconnect the board, destroy the instance and remove it from the cache', async () => {
            spyOn(service, 'getBoardById').and.returnValue(boardMock);
            spyOn<any>(service, 'disconnectBoard');
            spyOn<any>(service, 'removeFromCache');

            await service.deleteBoard(boardMock.id);

            expect(service.getBoardById).toHaveBeenCalledWith(boardMock.id);
            expect(service[properties.disconnectBoard]).toHaveBeenCalledWith(boardMock.id);
            expect(service[properties.removeFromCache]).toHaveBeenCalledWith(boardMock.id);
            expect(BoardDAO.destroy).toHaveBeenCalledWith(boardMock);
        });
    });

    describe('#disconnectBoard', () => {
        test('should call the board disconnect method and emit the disconnect event', () => {
            addBoardToCache();
            service[properties.disconnectBoard](boardMock.id);

            expect(boardMock.disconnect).toHaveBeenCalled();
            expect(service[properties.emit]).toHaveBeenCalledWith('disconnected', discreteBoardMock);
        });
    });

    describe('#removeFromCache', () => {
        test('should remove the board from cache', () => {
            addBoardToCache();

            service[properties.removeFromCache](boardMock.id);

            expect(service[properties.cache].length).toEqual(0);
        });
    });

    describe('#addBoardToCache', () => {
        test('should add the supplied board to the cache', () => {
            service[properties.addBoardToCache](boardMock);

            expect(service[properties.cache][0]).toEqual(boardMock);
        });
    });

    describe('board update methods', () => {
        let boardUpdates;
        let board;
        const name = 'newBoardName';

        beforeEach(() => {
            boardUpdates = Object.assign(discreteBoardMock, { name });
            board = Object.assign(boardMock, boardUpdates);

            spyOn<any>(service, 'persistChanges').and.returnValue(Promise.resolve(board));
        });

        describe('#updateBoard', () => {
            beforeEach(() => {
                spyOn<any>(service, 'updateCachedBoard');
            });

            test('should run updateOnlineBoard and updateCachedBoard methods', async () => {
                const _boardUpdates = Object.assign({}, discreteBoardMock);
                const onlineBoard = Object.assign({}, boardMock);
                _boardUpdates.online = true;
                onlineBoard.online = true;

                spyOn(service, 'getBoardById').and.returnValue(onlineBoard);
                spyOn<any>(service, 'updateOnlineBoard').and.returnValue(Promise.resolve(onlineBoard));

                await service[properties.updateBoard](_boardUpdates);

                expect(service[properties.updateOnlineBoard]).toHaveBeenCalledWith(onlineBoard, _boardUpdates);
                expect(service[properties.updateCachedBoard]).toHaveBeenCalledWith(onlineBoard);
            });

            test('should run updateOfflineBoard and updateCachedBoard methods', async () => {
                spyOn(service, 'getBoardById').and.returnValue(boardMock);
                spyOn<any>(service, 'updateOfflineBoard').and.returnValue(Promise.resolve(boardMock));

                await service[properties.updateBoard](discreteBoardMock);

                expect(service[properties.updateOfflineBoard]).toHaveBeenCalledWith(boardMock, discreteBoardMock);
                expect(service[properties.updateCachedBoard]).toHaveBeenCalledWith(boardMock);
            });
        });

        describe('#updateCachedBoard', () => {
            test('should replace the cached board instance with the supplied one', () => {
                addBoardToCache();
                board.name = name;

                service[properties.updateCachedBoard](board);

                expect(service[properties.cache][0].name).toEqual(name);
                expect(service[properties.cache][0]).toEqual(board);
            });
        });

        describe('#updateOfflineBoard', () => {
            test('should update the board and call the persistChanges method', async () => {
                const result = await service[properties.updateOfflineBoard](boardMock, boardUpdates);

                expect(result).toBeDefined();
                expect(result.name).toEqual(name);
                expect(service[properties.persistChanges]).toHaveBeenCalledWith(boardMock);
            });
        });

        describe('#updateOnlineBoard', () => {
            test('should update the board and call the persistChanges method if the board type has not changed', async () => {
                const result = await service[properties.updateOnlineBoard](boardMock, boardUpdates);

                expect(result).toBeDefined();
                expect(result.name).toEqual(name);
                expect(service[properties.persistChanges]).toHaveBeenCalledWith(boardMock);
            });

            test('should update the board, call the persistChanges method and reinstantiate the board with the new type if the board type has changed', async () => {
                const newType = 'LedController';
                boardUpdates.type = newType;
                const dataValues = board.getDataValues();
                dataValues.type = newType;
                const result = await service[properties.updateOnlineBoard](boardMock, boardUpdates);

                expect(board.clearAllTimers).toHaveBeenCalled();
                expect(board.attachFirmataBoard).toHaveBeenCalled();
                expect(BoardDAO.createBoardInstance).toHaveBeenCalledWith(dataValues);
                expect(result).toBeDefined();
                expect(result).toBeDefined();
                expect(result.type).toEqual(newType);
                expect(service[properties.persistChanges]).toHaveBeenCalledWith(board);
            });
        });
    });

    describe('#persistChanges', () => {
        test('should call the BoardDAO persist method to persist the changes in a board and emit an update event', async () => {
            const result = await service[properties.persistChanges](boardMock);

            expect(BoardDAO.persist).toHaveBeenCalledWith(boardMock);
            expect(result).toBeDefined();
            expect(service[properties.emit]).toHaveBeenCalledWith('update', discreteBoardMock);
        });
    });

    describe('#initialiseCachedBoard', () => {
        test('should initialise a cached board and update the cached instance with the new instance', () => {
            addBoardToCache();
            const expectedResult = Object.assign({}, boardMock);
            expectedResult.firmataBoard = firmataBoardMockFactory;

            spyOn<any>(BoardService, 'initialiseBoard').and.returnValue(expectedResult);

            const result = service[properties.initialiseCachedBoard](boardMock.id, firmataBoardMockFactory);

            expect(result).toBeDefined();
            expect(BoardService[properties.initialiseBoard]).toHaveBeenCalled();
            expect(service[properties.cache][0]).toEqual(expectedResult);
        });
    });

    describe('#initialiseBoard', () => {
        test('should create a new instance of the given board and call the board attachFirmataBoard method', () => {
            const result = BoardService[properties.initialiseBoard](boardMock, firmataBoardMockFactory);

            expect(result).toBeDefined();
            expect(boardMock.attachFirmataBoard).toHaveBeenCalled();
            expect(BoardDAO.createBoardInstance).toHaveBeenCalledWith(dataValuesMock);
        });
    });

    //
    // describe('#executeProgramOnBoard', () => {
    //     let board: Board;
    //
    //     beforeEach(async () => {
    //         board = new Board();
    //         board.id = 'bacon';
    //         board.name = 'eggs';
    //         board.online = true;
    //         await board.save();
    //         service._boards = [board];
    //         service.runProgram = jest.fn(() => Promise.resolve());
    //     });
    //
    //     describe('happy flows', () => {
    //         test('should run the program once', async () => {
    //             const boardClone = Object.assign(Object.create(Object.getPrototypeOf(board)), board);
    //             boardClone.currentProgram = blink.name;
    //
    //             await service.executeProgramOnBoard(board.id, blink);
    //
    //             expect(service.runProgram).toHaveBeenCalledTimes(1);
    //             expect(service.runProgram).toHaveBeenCalledWith(Board.toDiscrete(boardClone), blink);
    //         });
    //
    //         test('should run the program thrice', async () => {
    //             await service.executeProgramOnBoard(board.id, blink, 3);
    //
    //             expect(service.runProgram).toHaveBeenCalledTimes(3);
    //         });
    //
    //         // fixme: the indefinite part can't be tested yet
    //         // xtest('should run the program indefinitely', done => {
    //         //     service.executeProgramOnBoard(board.id, blink, -1);
    //         //
    //         //     setTimeout(() => {
    //         //         service.stopProgram(board.id);
    //         //         expect(board.currentProgram).toEqual(blink.name);
    //         //         expect(service.runProgram).toHaveBeenCalledTimes(1);
    //         //         done();
    //         //     }, 10);
    //         // });
    //     });
    //
    //     describe('exception flows', () => {
    //         test('should return an error when the board is not idle', async () => {
    //             board.currentProgram = 'eggs';
    //
    //             const executeProgramOnBoardError = async () => {
    //                 await service.executeProgramOnBoard(board.id, blink);
    //             };
    //
    //             await expect(executeProgramOnBoardError()).rejects.toThrowError(
    //                 new BoardUnavailableError(
    //                     `Board with id ${board.id} is already running a program (${board.currentProgram}). Stop the currently running program or wait for it to finish.`,
    //                 ),
    //             );
    //         });
    //
    //         test('should return an error if the program isn't compatible with the board', async () => {
    //             board.currentProgram = IDLE;
    //             // const blinkForOtherType = Object.assign({}, blink);
    //
    //             blink.deviceType = 'OtherBoardType';
    //
    //             const executeProgramOnBoardError = async () => {
    //                 await service.executeProgramOnBoard(board.id, blink);
    //             };
    //
    //             await expect(executeProgramOnBoardError()).rejects.toThrowError(
    //                 new BoardIncompatibleError(
    //                     `The program ${blink.name} cannot be run on board with id ${board.id}, because it is of the wrong type. Program ${blink.name} can only be run on devices of type ${blink.deviceType}.`,
    //                 ),
    //             );
    //         });
    //     });
    // });
    //
    // describe('#createAndPersistNewBoard', () => {
    //     test('should create a new instance of the board parameter if type doesnt match constructor name', async () => {
    //         let board = new Board();
    //         board.type = 'LedController';
    //
    //         board = await service.createAndPersistBoard(board);
    //
    //         expect(board.type).toEqual(board.type);
    //     });
    // });
    //
    // describe('#runProgram', () => {
    //     test('should run the program', async () => {
    //         const board = new Board();
    //         board.id = 'bacon';
    //         board.currentProgram = blink.name;
    //         service.executeCommandOnBoard = jest.fn(() => Promise.resolve());
    //
    //         await service.runProgram(Board.toDiscrete(board), blink);
    //
    //         expect(service.executeCommandOnBoard).toHaveBeenCalledTimes(blink.commands.length);
    //         expect(service.executeCommandOnBoard).toHaveBeenLastCalledWith(
    //             board.id,
    //             blink.commands[blink.commands.length - 1],
    //         );
    //     });
    //
    //     test('should stop running the program', async () => {
    //         const board = new Board();
    //         board.id = 'bacon';
    //         board.currentProgram = IDLE;
    //         service.executeCommandOnBoard = jest.fn(() => Promise.resolve());
    //
    //         await service.runProgram(Board.toDiscrete(board), blink);
    //
    //         expect(service.executeCommandOnBoard).toHaveBeenCalledTimes(0);
    //     });
    // });
});
