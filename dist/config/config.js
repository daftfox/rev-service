"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const args = require("args");
/**
 * Configuration
 *
 * @classdesc // todo
 * @namespace Config
 */
class Config {
    /**
     * @static
     * @access public
     * @returns {IFlags}
     */
    static parseOptions(flags) {
        return Config.flags.parse(flags);
    }
}
/**
 * @static
 * @access private
 */
Config.flags = args
    .option('port', 'Port from which the WebSocket service will be served.', 3001)
    // If you intend to use the provided firmware without changing any of its parameters, don't touch the setting below!
    .option('ethPort', 'Port from which the ethernet service will be served.', 9000)
    .option('debug', 'Enable debug logging.', false)
    .option('serial', 'Enable serial interface.', false)
    .option('ethernet', 'Enable ethernet interface.', false);
exports.default = Config;
//# sourceMappingURL=config.js.map