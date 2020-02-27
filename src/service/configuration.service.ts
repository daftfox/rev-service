import * as Args from 'args';
import { singleton } from 'tsyringe';
import { IAppConfiguration, IDatabaseConfiguration } from '../domain/configuration';
import { DatabaseConfiguration } from '../domain/configuration/base';
import { IFlags } from '../domain/configuration/interface/flags.interface';
import { AppConfiguration } from '../domain/configuration/base/app-configuration.model';

@singleton()
export class ConfigurationService {
    private _databaseConfiguration: IDatabaseConfiguration;
    private _appConfiguration: IAppConfiguration;
    private _webSocketPort: number;
    private _ethernetPort: number;
    private _flags: IFlags;

    constructor() {
        this.parseConfiguration(process.argv);
    }

    public get databaseConfiguration(): DatabaseConfiguration {
        return this._databaseConfiguration;
    }

    public get webSocketPort(): number {
        return this._webSocketPort;
    }

    public get ethernetPort(): number {
        return this._ethernetPort;
    }

    public get appConfiguration(): AppConfiguration {
        return this._appConfiguration;
    }

    private static flags = Args
        .option('port', 'Port from which the WebSocket service will be served.', 3001)
        .option('ethernetPort', 'Port from which the ethernet service will be served.', 9000)
        .option('debug', 'Enable debug logging.', false)
        .option('serial', 'Enable serial interface.', true)
        .option('ethernet', 'Enable ethernet interface.', true)
        .option('dbSchema', 'The default schema to use', 'rev')
        .option('dbHost', "The database server's address.", 'localhost')
        .option('dbPort', 'Port on which the database server is running.', 3306)
        .option('dbUsername', 'Username to log in to database server.', '')
        .option('dbPassword', 'Password to log in to database server.', '')
        .option('dbDialect', "The database server's dialect (mysql, postgres, mariadb, sqlite, mssql).", 'sqlite')
        .option('dbPath', 'Path to database file (optional, only for sqlite).', ':memory:');

    public parseConfiguration(flags: string[]): void {
        this._flags = ConfigurationService.flags.parse(flags);

        this._databaseConfiguration = new DatabaseConfiguration(this._flags);
        this._appConfiguration = new AppConfiguration(this._flags);
        this._webSocketPort = this._flags.port;
        this._ethernetPort = this._flags.ethernetPort;
    }
}
