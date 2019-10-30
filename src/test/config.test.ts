import Config from '../config/config';

const defaultConfig = {
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
    dbPath: ':memory:'
};

describe('Config:', () => {
    test('default options are set', () => {
        const options = Config.parseOptions( process.argv );

        expect(options.port).toBe(defaultConfig.port);
        expect(options.ethernetPort).toBe(defaultConfig.ethernetPort);
        expect(options.debug).toBe(defaultConfig.debug);
        expect(options.serial).toBe(defaultConfig.serial);
        expect(options.ethernet).toBe(defaultConfig.ethernet);
        expect(options.dbSchema).toBe(defaultConfig.dbSchema);
        expect(options.dbHost).toBe(defaultConfig.dbHost);
        expect(options.dbPort).toBe(defaultConfig.dbPort);
        expect(options.dbUsername).toBe(defaultConfig.dbUsername);
        expect(options.dbPassword).toBe(defaultConfig.dbPassword);
        expect(options.dbDialect).toBe(defaultConfig.dbDialect);
        expect(options.dbPath).toBe(defaultConfig.dbPath);
    });
});