"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const program_1 = require("../domain/program");
const board_1 = require("../domain/board");
const logger_1 = require("./logger");
class DatabaseService {
    constructor() {
        DatabaseService.database = new sequelize_typescript_1.Sequelize({
            dialect: 'sqlite',
            storage: './database/rev.db',
            logging: false,
        });
        DatabaseService.database.addModels([
            program_1.default,
            board_1.default,
        ]);
    }
    /**
     * Synchronise the datamodel with the database.
     *
     * @access public
     * @return {void}
     */
    synchronise() {
        DatabaseService.log.info(`Synchronising database model.`);
        return DatabaseService.database
            .sync()
            .then(() => {
            const blinkProgram = program_1.default.build(program_1.defaultPrograms.BLINK_PROGRAM);
            blinkProgram.setCommands(program_1.defaultPrograms.BLINK_PROGRAM.commands);
            blinkProgram.save();
            const sosProgram = program_1.default.build(program_1.defaultPrograms.SOS_PROGRAM);
            sosProgram.setCommands(program_1.defaultPrograms.SOS_PROGRAM.commands);
            sosProgram.save();
        });
    }
}
/**
 * @static
 * @access private
 * @type {string}
 */
DatabaseService.namespace = `database`;
/**
 * @static
 * @access private
 * @type {Logger}
 */
DatabaseService.log = new logger_1.default(DatabaseService.namespace);
exports.default = DatabaseService;
//# sourceMappingURL=database-service.js.map