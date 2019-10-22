import Config from '../config/config';

describe('Config:', () => {
    test('default options are set', () => {
        const options = Config.parseOptions( process.argv );

        expect(options.port).toBe(3001);
        expect(options.ethernetPort).toBe(9000);
        expect(options.debug).toBe(false);
        expect(options.serial).toBe(true);
        expect(options.ethernet).toBe(true);
        expect(options.dbSchema).toBe('rev');
        expect(options.dbHost).toBe('localhost');
        expect(options.dbPort).toBe(3306);
        expect(options.dbUsername).toBe('');
        expect(options.dbPassword).toBe('');
        expect(options.dbDialect).toBe('sqlite');
        expect(options.dbPath).toBe('database/rev.db');
    });
});