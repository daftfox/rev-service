import { ConfigurationService } from './configuration.service';
import { DatabaseConfiguration } from '../domain/configuration/base';
import { AppConfiguration } from '../domain/configuration/base/app-configuration.model';

let service: ConfigurationService;
const argv = ['usr/local/bin/node', '/Users/tim/Projects/rev/rev-back-end/dist/index.js'];
const expectedDefaultConfiguration = {
    port: 3001,
    ethernetPort: 9000,
    debug: false,
    serial: false,
    ethernet: true,
    dbSchema: 'rev',
    dbHost: 'localhost',
    dbPort: 3306,
    dbUsername: '',
    dbPassword: '',
    dbDialect: 'sqlite',
    dbPath: ':memory:',
    D: ':memory:',
    E: true,
    d: false,
    e: 9000,
    p: 3001,
    s: false,
};

const properties = {
    parseConfiguration: 'parseConfiguration',
    _flags: '_flags',
};

beforeEach(() => {
    process.argv = argv;
    service = new ConfigurationService();
});

describe('ConfigurationService', () => {
    describe('constructor', () => {
        test('should instantiate', () => {
            expect(service).toBeDefined();
        });
    });

    describe('#parseConfiguration', () => {
        test('should produce the default configuration', () => {
            service[properties.parseConfiguration](argv);
            expect(service[properties._flags]).toEqual(expectedDefaultConfiguration);
        });

        test('should parse the debug argument and set the config to true', () => {
            const customArguments = [...argv, '--debug'];

            service[properties.parseConfiguration](customArguments);

            expect(service[properties._flags].debug).toEqual(true);
        });

        test('should parse the port argument and set the config to 3333', () => {
            const customArguments = [...argv, '--port=3333'];

            service[properties.parseConfiguration](customArguments);

            expect(service[properties._flags].port).toEqual(3333);
        });
    });

    describe('#get databaseConfiguration', () => {
        test('should return the databaseConfiguration object', () => {
            const result = service.databaseConfiguration;

            expect(result).toBeDefined();
            expect(result instanceof DatabaseConfiguration).toEqual(true);
        });
    });

    describe('#get webSocketPort', () => {
        test('should return the web socket port number', () => {
            const result = service.webSocketPort;

            expect(result).toBeDefined();
            expect(typeof result).toEqual('number');
        });
    });

    describe('#get ethernetPort', () => {
        test('should return the ethernet port number', () => {
            const result = service.ethernetPort;

            expect(result).toBeDefined();
            expect(typeof result).toEqual('number');
        });
    });

    describe('#get appConfiguration', () => {
        test('should return the application configuration object', () => {
            const result = service.appConfiguration;

            expect(result).toBeDefined();
            expect(result instanceof AppConfiguration).toEqual(true);
        });
    });
});
