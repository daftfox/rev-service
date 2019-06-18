import { Sequelize } from 'sequelize-typescript';
import Program, {defaultPrograms} from "../domain/program";
import Board from "../domain/board";
import Logger from "./logger";

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
     * @type {Logger}
     */
    private static log = new Logger( DatabaseService.namespace );

    constructor() {
        DatabaseService.database = new Sequelize({
            dialect: 'sqlite',
            storage: './database/rev.db',
            logging: false,
        } );

        DatabaseService.database.addModels( [
            Program,
            Board,
        ] );
    }

    /**
     * Synchronise the datamodel with the database.
     *
     * @access public
     * @return {void}
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