import { DatabaseService, ProgramService } from './';
import { blink, sos } from '../domain/program/example';
import {BoardUnavailableError, ProgramNotFoundError} from '../domain/error';
import {boardMock} from "../domain/board/base/__mocks__/board.model";
import {ICommand} from "../domain/program/interface";
import {IDLE} from "../domain/board/base";

let service: ProgramService;

beforeEach(async () => {
    service = new ProgramService();
});

xdescribe('ProgramsService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(service).toBeDefined();
        });
    });

    xdescribe('#updateCache', () => {
        test('should retrieve existing service from the database', async () => {
            const numberOfPrograms = Object.keys([blink, sos]).length;

            await service.synchronise();

            // expect(service._service.length).toEqual(numberOfPrograms);
        });
    });

    describe('#getAllPrograms', () => {
        test('should return an array of service', async () => {
            const numberOfPrograms = Object.keys([blink, sos]).length;

            await service.synchronise();

            const result = service.getAllPrograms();

            expect(Array.isArray(result)).toEqual(true);
            expect(result.length).toEqual(numberOfPrograms);
        });
    });

    describe('#getProgramById', () => {
        beforeEach(async () => {
            await service.synchronise();
        });

        describe('happy flows', () => {
            test('should return a program instance', () => {
                const program = service.getAllPrograms().pop();
                const result = service.getProgramById(program.id);

                expect(result).toBeDefined();
            });
        });

        describe('exception flows', () => {
            test('should return a not found error', () => {
                const id = 'test';
                const getProgramByIdError = () => {
                    service.getProgramById(id);
                };

                expect(getProgramByIdError).toThrowError(
                    new ProgramNotFoundError(`Program with id ${id} could not be found.`),
                );
            });
        });
    });

    describe('#createprogram', () => {
        test('should return an instance of program', () => {
            const program = ProgramService.createProgram({
                name: 'test',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }, { action: 'TOGGLELED', duration: 1000 }],
            });

            expect(program).toBeDefined();
            expect(program.name).toEqual('test');
            expect(program.constructor.name).toEqual('Program');
        });
    });

    describe('#addProgram', () => {
        test('should add a program to the list of existing service and persist it to the database', async () => {
            const program = ProgramService.createProgram({
                name: 'test',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }, { action: 'TOGGLELED', duration: 1000 }],
            });

            program.save = jest.fn();

            await service.addProgram(program);

            //expect(service._service.length).toEqual(1);
            expect(program.save).toHaveBeenCalled();
        });
    });

    describe('#deleteProgram', () => {
        test('should delete a program', async () => {
            const program = ProgramService.createProgram({
                name: 'test',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }, { action: 'TOGGLELED', duration: 1000 }],
            });
            program.destroy = jest.fn();

            await service.addProgram(program);
            await service.deleteProgram(program.id);

            expect(program.destroy).toHaveBeenCalled();
            // expect(service._service.length).toEqual(0);
        });
    });

    describe('#updateProgram', () => {
        test('should update an existing program', async () => {
            const program = ProgramService.createProgram({
                name: 'test',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }, { action: 'TOGGLELED', duration: 1000 }],
            });
            program.update = jest.fn();
            await service.addProgram(program);

            const programUpdates = {
                id: program.id,
                name: 'fromage',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }],
            };

            await service.updateProgram(programUpdates);

            expect(program.update).toHaveBeenCalledWith(programUpdates);
        });
    });

    xdescribe('#executeCommandOnBoard', () => {
        beforeAll(() => {
            spyOn(global, 'setTimeout').and.callThrough();
            spyOn(global, 'clearTimeout').and.callThrough();
        });

        beforeEach(() => {
            jest.useFakeTimers();
            //service[properties.cache].push(boardMock);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

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
        ])('should execute the action',(command: ICommand) => {
            service.executeCommandOnBoard(boardMock.id, command);
            jest.advanceTimersByTime(100);

            expect(boardMock.executeAction).toHaveBeenCalledWith(command.action, command.parameters);
            expect(global.setTimeout).toHaveBeenCalled();
        });

        test('should execute the given action and resolve after ~50ms',(done) => {
            jest.useRealTimers();
            const expectedDuration = 50;

            const command: ICommand = {
                action: 'TOGGLELED',
                duration: expectedDuration
            };
            const timestampBefore = Date.now();

            service.executeCommandOnBoard(boardMock.id, command)
                .then(() => {
                    const difference = (Date.now() - timestampBefore);
                    expect(difference >= expectedDuration && difference < (expectedDuration + 20)).toEqual(true);
                    done();
                });

            expect(boardMock.executeAction).toHaveBeenCalledWith(command.action, undefined);
        });

        test('should run clearTimeout and reject when an error occurs', () => {
            const expectedError = new BoardUnavailableError(`Unable to execute action on this board since it is not online.`);
            spyOn(boardMock, 'executeAction').and.callFake(() => {throw expectedError});

            const command: ICommand = {
                action: 'TOGGLELED'
            };

            expect(service.executeCommandOnBoard(boardMock.id, command)).rejects.toEqual(expectedError);
            expect(global.clearTimeout).toHaveBeenCalled();
        });
    });

    xdescribe('#stopProgram', () => {
        test('should set the board current program to IDLE', () => {
            const board = Object.assign({}, boardMock);
            // service[properties.cache].push(board);
            board.currentProgram = 'TOGGLELED';

            service.stopProgram(board.id);

            expect(board.currentProgram).toEqual(IDLE);
        });
    });
});
