"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const args = require("args");
// Enable serial-servers: firmata-radar --serial
class Config {
}
Config.options = args
    .option('port', 'Port at which the websocket service will be served. Default: 9000', 9000)
    .option('start-port', 'The starting port in the port-range for Firmata boards. Default: 3030', 3030)
    .option('end-port', 'The end port in the port-range for Firmata boards. Default: 3031', 3031)
    .option('serial', 'Enable serial interface. Default: false', false)
    .option('ethernet', 'Enable ethernet interface. Default: false', false);
exports.default = Config;
//# sourceMappingURL=config.js.map