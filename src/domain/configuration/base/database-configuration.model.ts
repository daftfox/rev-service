import {IDatabaseConfiguration} from "../interface";
import {IFlags} from "../interface/flags.interface";

export class DatabaseConfiguration implements IDatabaseConfiguration {
    username: string;
    password: string;
    host: string;
    port: number;
    path: string;
    dialect: string;
    schema: string;
    debug: boolean;

    constructor({dbUsername, dbPassword, dbHost, dbPort, dbPath, dbDialect, dbSchema, debug}: IFlags){
        this.username = dbUsername;
        this.password = dbPassword;
        this.host = dbHost;
        this.port = dbPort;
        this.path = dbPath;
        this.dialect = dbDialect;
        this.schema = dbSchema;
        this.debug = debug;
    }
}