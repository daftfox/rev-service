import { Program } from '../domain/program';
import { DatabaseService } from './';

let databaseService: any;

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
    databaseService = new DatabaseService();
});

describe('ConnectionService:', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(databaseService).toBeDefined();
        });

        test('should set storage to undefined', () => {
            const differentOptions = Object.assign({}, databaseOptions);
            differentOptions.dialect = 'mysql';

            databaseService = new DatabaseService();
        });
    });

    describe('#synchronise', () => {
        test('should sync schema', async () => {
            // @ts-ignore
            DatabaseService.database.sync = jest.fn(() => Promise.resolve());

            await databaseService.synchronise();

            // @ts-ignore
            expect(DatabaseService.database.sync).toHaveBeenCalled();
        });
    });

    describe('#insertDefaultRecords', () => {
        test('should insert default programs', async () => {
            await databaseService.synchronise();

            // await databaseService.insertDefaultRecords();

            return expect(databaseService.insertDefaultRecords()).resolves.toBe(undefined);
        });

        xtest('should have persisted default programs to database', async () => {
            await databaseService.synchronise();

            Program.findAll().then(programs => {
                expect(programs.length).toEqual(2);
            });
        });
    });
});
