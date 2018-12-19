"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const args = require("args");
class Config {
    static parseFlags(flags) {
        return Config.flags.parse(flags);
    }
}
Config.flags = args
    .option('port', 'Port at which the websocket service will be served.', 80)
    .option('start-port', 'The starting port in the port-range for Firmata boards.', 3030)
    .option('end-port', 'The end port in the port-range for Firmata boards.', 3030)
    .option('serial', 'Enable serial interface.', false)
    .option('ethernet', 'Enable ethernet interface.', false);
exports.default = Config;
//# sourceMappingURL=config.js.map