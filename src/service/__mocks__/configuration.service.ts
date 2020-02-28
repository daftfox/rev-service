export class ConfigurationService {
    ethernetPort = 9000;
    webSocketPort = 3001;
    appConfiguration = {
        serial: true,
        debug: false,
        ethernet: true,
    };
    databaseConfiguration = {
        username: '',
        password: '',
        host: 'localhost',
        port: 3306,
        path: ':memory:',
        dialect: 'sqlite',
        schema: 'rev',
        debug: false,
    };
}
