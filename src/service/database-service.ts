import { Sequelize } from 'sequelize-typescript';
import Program from "../domain/program";
import Board from "../domain/board";
import LoggerService from "./logger-service";
import { Dialect } from "sequelize";
import IDatabaseOptions from "../domain/interface/database-options";
import DefaultPrograms from "../domain/programs/default";

class DatabaseService {
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
    private static namespace = `database`;

    /**
     * @static
     * @access private
     * @type {LoggerService}
     */
    private static log = new LoggerService( DatabaseService.namespace );

    constructor( options: IDatabaseOptions ) {
        DatabaseService.database = new Sequelize( options.schema, options.username, options.password, {
            dialect: options.dialect as Dialect,
            storage: options.dialect === 'sqlite' ? options.path : undefined,
            logging: options.debug,
        } );

        DatabaseService.database.addModels( [
            Program,
            Board,
        ] );
    }

    /**
     * Synchronise data model with the database.
     *
     * @access public
     * @returns {Promise<void>}
     */
    public async synchronise(): Promise<void> {
        DatabaseService.log.info(`Synchronising database model.`);

        await DatabaseService.database
            .sync()
            .then(
                () => {
                    const blinkProgram = Program.build( DefaultPrograms.BLINK);
                    blinkProgram.save();

                    const sosProgram = Program.build( DefaultPrograms.SOS );
                    sosProgram.save();
                }
        );
    }
}

export default DatabaseService;