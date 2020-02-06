import { Sequelize } from 'sequelize-typescript';
import { Program, blink, sos } from '../domain/program';
import { Board } from '../domain/board';
import { Dialect } from 'sequelize';
import {container, singleton} from "tsyringe";
import {ConfigurationService} from "./configuration.service";

@singleton()
export class DatabaseService {
    /**
     * @static
     * @access private
     * @type {Sequelize}
     */
    private static database: Sequelize;

    /**
     * @static
     * @access private
     * @type {string}
     */
    private namespace = `database-service`;

    constructor() {
        const configuration = container.resolve(ConfigurationService).databaseConfiguration;

        DatabaseService.database = new Sequelize(configuration.schema, configuration.username, configuration.password, {
            dialect: configuration.dialect as Dialect,
            storage: configuration.dialect === 'sqlite' ? configuration.path : undefined,
            logging: configuration.debug,
        });

        DatabaseService.database.addModels([Program, Board]);
    }

    public synchronise(): Promise<void> {
        return DatabaseService.database.sync();
    }

    /**
     * Synchronise data model with the database.
     *
     * @access public
     * @returns {Promise<void>}
     */
    public async insertDefaultRecords(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await Program.create(blink);
            await Program.create(sos);
            resolve();
        });
    }
}
