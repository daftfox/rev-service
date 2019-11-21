import ProgramsModel from '../model/programs.model';
import { Sequelize } from 'sequelize-typescript';
import Board from '../domain/board';
import DatabaseService from '../service/database.service';
import DefaultPrograms from '../domain/programs/default';
import { NotFound } from '../error/errors';

let programs: any;
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
    programs = new ProgramsModel();
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

describe('ProgramsModel', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(programs).toBeDefined();
        });
    });

    describe('#synchronise', () => {
        test('should retrieve existing programs from the database', async () => {
            const numberOfPrograms = Object.keys(DefaultPrograms).length;

            await programs.synchronise();

            expect(programs._programs.length).toEqual(numberOfPrograms);
        });
    });

    describe('#getAllPrograms', () => {
        test('should return an array of programs', async () => {
            const numberOfPrograms = Object.keys(DefaultPrograms).length;

            await programs.synchronise();

            const result = programs.getAllPrograms();

            expect(Array.isArray(result)).toEqual(true);
            expect(result.length).toEqual(numberOfPrograms);
        });
    });

    describe('#getProgramById', () => {
        beforeEach(async () => {
            await programs.synchronise();
        });

        describe('happy flows', () => {
            test('should return a program instance', () => {
                const program = programs.getAllPrograms().pop();
                const result = programs.getProgramById(program.id);

                expect(result).toBeDefined();
            });
        });

        describe('exception flows', () => {
            test('should return a not found error', () => {
                const id = 'test';
                const getProgramByIdError = () => {
                    programs.getProgramById(id);
                };

                expect(getProgramByIdError).toThrowError(new NotFound(`Program with id ${id} could not be found.`));
            });
        });
    });

    describe('#createprogram', () => {
        test('should return an instance of program', () => {
            const program = ProgramsModel.createProgram({
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
        test('should add a program to the list of existing programs and persist it to the database', async () => {
            const program = ProgramsModel.createProgram({
                name: 'test',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }, { action: 'TOGGLELED', duration: 1000 }],
            });

            program.save = jest.fn();

            await programs.addProgram(program);

            expect(programs._programs.length).toEqual(1);
            expect(program.save).toHaveBeenCalled();
        });
    });

    describe('#deleteProgram', () => {
        test('should delete a program', async () => {
            const program = ProgramsModel.createProgram({
                name: 'test',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }, { action: 'TOGGLELED', duration: 1000 }],
            });
            program.destroy = jest.fn();

            await programs.addProgram(program);
            await programs.deleteProgram(program.id);

            expect(program.destroy).toHaveBeenCalled();
            expect(programs._programs.length).toEqual(0);
        });
    });

    describe('#updateProgram', () => {
        test('should update an existing program', async () => {
            const program = ProgramsModel.createProgram({
                name: 'test',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }, { action: 'TOGGLELED', duration: 1000 }],
            });
            program.update = jest.fn();
            await programs.addProgram(program);

            const programUpdates = {
                id: program.id,
                name: 'fromage',
                deviceType: 'all',
                commands: [{ action: 'TOGGLELED', duration: 1000 }],
            };

            await programs.updateProgram(programUpdates);

            expect(program.update).toHaveBeenCalledWith(programUpdates);
        });
    });
});
