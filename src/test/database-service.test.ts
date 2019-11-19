import { Sequelize } from 'sequelize-typescript';
import Board from '../domain/board';
import Program from '../domain/program';
import DatabaseService from '../service/database-service';

let databaseService: any;
let sequelize: Sequelize;

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

console.info = () => {};

beforeEach(() => {
    databaseService = new DatabaseService(databaseOptions);
});

describe('ConnectionService:', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(databaseService).toBeDefined();
        });

        test('should set storage to undefined', () => {
            const differentOptions = Object.assign({}, databaseOptions);
            differentOptions.dialect = 'mysql';

            databaseService = new DatabaseService(differentOptions);
        });
    });

    describe('#synchronise', () => {
        test('should synchronise data model', async () => {
            // @ts-ignore
            DatabaseService.database.sync = jest.fn();

            await databaseService.synchronise();

            // @ts-ignore
            expect(DatabaseService.database.sync).toHaveBeenCalled();
        });

        test('should have persisted default programs to database', async () => {
            await databaseService.synchronise();

            Program.findAll().then(programs => {
                expect(programs.length).toEqual(2);
            });
        });
    });
});
