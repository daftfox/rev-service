import Config from '../config/config';

const defaultOptions = {
    port: 3001,
    ethernetPort: 9000,
    debug: false,
    serial: true,
    ethernet: true,
    dbSchema: 'rev',
    dbHost: 'localhost',
    dbPort: 3306,
    dbUsername: '',
    dbPassword: '',
    dbDialect: 'sqlite',
    dbPath: ':memory:',
};

describe('Config:', () => {
    test('default options are set', () => {
        const options = Config.parseOptions(process.argv);

        expect(options.port).toBe(defaultOptions.port);
        expect(options.ethernetPort).toBe(defaultOptions.ethernetPort);
        expect(options.debug).toBe(defaultOptions.debug);
        expect(options.serial).toBe(defaultOptions.serial);
        expect(options.ethernet).toBe(defaultOptions.ethernet);
        expect(options.dbSchema).toBe(defaultOptions.dbSchema);
        expect(options.dbHost).toBe(defaultOptions.dbHost);
        expect(options.dbPort).toBe(defaultOptions.dbPort);
        expect(options.dbUsername).toBe(defaultOptions.dbUsername);
        expect(options.dbPassword).toBe(defaultOptions.dbPassword);
        expect(options.dbDialect).toBe(defaultOptions.dbDialect);
        expect(options.dbPath).toBe(defaultOptions.dbPath);
    });
});
