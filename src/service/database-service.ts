import { Sequelize } from 'sequelize-typescript';
import Program, {defaultPrograms} from "../domain/program";
import Board from "../domain/board";
import LoggerService from "./logger-service";
import { Dialect } from "sequelize";
import IDatabaseOptions from "../interface/database-options";

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
            storage: options.dialect === 'sqlite' ? options.path : null,
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
    public synchronise(): Promise<void> {
        DatabaseService.log.info(`Synchronising database model.`);

        return DatabaseService.database
            .sync()
            .then(
                () => {
                    const blinkProgram = Program.build( defaultPrograms.BLINK_PROGRAM );
                    blinkProgram.setCommands( defaultPrograms.BLINK_PROGRAM.commands );
                    blinkProgram.save();

                    const sosProgram = Program.build( defaultPrograms.SOS_PROGRAM );
                    sosProgram.setCommands( defaultPrograms.SOS_PROGRAM.commands );
                    sosProgram.save();
                }
        );
    }
}

export default DatabaseService;