"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config/config");
// import SerialService from '../service/serial-service';
const ethernet_service_1 = require("../service/ethernet-service");
const web_socket_service_1 = require("../service/web-socket-service");
const logger_1 = require("../service/logger");
const boards_1 = require("../model/boards");
const command_unavailable_1 = require("../error/command-unavailable");
const no_available_port_error_1 = require("../error/no-available-port-error");
const not_found_error_1 = require("../error/not-found-error");
const generic_board_error_1 = require("../error/generic-board-error");
const database_service_1 = require("../service/database-service");
const programs_1 = require("../model/programs");
const serial_service_1 = require("../service/serial-service");
// only required during dev
require('longjohn');
/**
 * The MainController is the main controller. 'nuff said.
 * @namespace MainController
 */
class MainController {
    /**
     * Creates a new instance of MainController and starts required services.
     *
     * @constructor
     */
    constructor() {
        /**
         * Local instance of the {@link Logger} class.
         *
         * @access private
         * @type {Logger}
         */
        this.log = new logger_1.default(MainController.namespace);
        this.options = config_1.default.parseOptions(process.argv);
        this.log.info('Starting rev-service');
        process.env.debug = this.options.debug ? 'true' : '';
        this.startServices();
    }
    /**
     * Start services that are required to run the application.
     *
     * @access private
     */
    startServices() {
        new database_service_1.default().synchronise()
            .then(() => {
            this.boardModel = new boards_1.default();
            this.programModel = new programs_1.default();
            this.socketService = new web_socket_service_1.default(this.options.port, this.boardModel, this.programModel);
            if (this.options.ethernet) {
                this.ethernetService = new ethernet_service_1.default(this.boardModel, this.options.ethPort);
            }
            if (this.options.serial) {
                this.serialService = new serial_service_1.default(this.boardModel);
            }
        });
        process.on('uncaughtException', this.handleError.bind(this));
    }
    /**
     * Handle errors.
     *
     * @access private
     * @param {Error} error
     */
    handleError(error) {
        switch (error.constructor) {
            case command_unavailable_1.default:
            case no_available_port_error_1.default:
            case not_found_error_1.default:
                this.log.warn(error.message);
                break;
            case Error:
                this.log.stack(error);
                break;
            case generic_board_error_1.default:
            default:
                this.log.stack(error);
        }
    }
}
/**
 * Namespace used by the local instance of {@link Logger}
 *
 * @type {string}
 * @static
 * @access private
 */
MainController.namespace = `main`;
exports.default = MainController;
//# sourceMappingURL=main.js.map