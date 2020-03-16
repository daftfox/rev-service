import { DatabaseService } from './';
jest.mock('./configuration.service');
jest.mock('./logger.service');

let databaseService: DatabaseService;

const properties = {
    database: 'database',
};

beforeEach(() => {
    databaseService = new DatabaseService();
});

describe('DatabaseService:', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(databaseService).toBeDefined();
        });
    });

    describe('#updateCache', () => {
        test('should sync schema', async () => {
            const spy = spyOn(DatabaseService[properties.database], 'sync').and.returnValue(Promise.resolve());

            await databaseService.synchronise();

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('#insertDefaultRecords', () => {
        test('should insert default programs', async () => {
            await databaseService.synchronise();

            return expect(databaseService.insertDefaultRecords()).resolves.toBe(undefined);
        });
    });
});
