"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_service_1 = require("./connection-service");
const Serialport = require("serialport");
const logger_1 = require("./logger");
const chalk_1 = require("chalk");
/**
 * @description Service that automatically connects to any Firmata compatible devices physically connected to the host.
 * @namespace SerialService
 */
class SerialService extends connection_service_1.default {
    /**
     * @constructor
     * @param {Boards} model
     */
    constructor(model) {
        super(model);
        /**
         * A list of port IDs in which an unsupported device is plugged in.
         * @access private
         * @type {string[]}
         */
        this.unsupportedDevices = [];
        this.usedPorts = [];
        this.namespace = 'serial';
        this.log = new logger_1.default(this.namespace);
        this.log.info(`Listening on serial ports.`);
        this.startListening();
    }
    /**
     * Scans the host's ports every 3 seconds.
     * @access private
     */
    startListening() {
        setInterval(this.scanSerialPorts.bind(this), 10000);
    }
    /**
     * Scans serial ports and automatically connects to all compatible devices.
     * @access private
     */
    scanSerialPorts() {
        Serialport.list((error, ports) => {
            const availablePort = ports
                .filter(port => port.productId !== undefined)
                .filter(port => this.usedPorts.indexOf(port.comName) < 0)
                .filter(port => this.unsupportedDevices.indexOf(port.comName) < 0).pop();
            if (availablePort) {
                this.usedPorts.push(availablePort.comName);
                this.connectToBoard(availablePort.comName, true, (board) => {
                    this.log.info(`Device ${chalk_1.default.rgb(0, 143, 255).bold(board.id)} connected.`);
                }, (board) => {
                    this.usedPorts.splice(this.usedPorts.indexOf(availablePort.comName), 1);
                    if (board) {
                        this.log.info(`Device ${board.id} disconnected.`);
                        this.model.disconnectBoard(board.id);
                    }
                    else {
                        this.unsupportedDevices.push(availablePort.comName);
                    }
                });
            }
        });
    }
}
exports.default = SerialService;
//# sourceMappingURL=serial-service.js.map