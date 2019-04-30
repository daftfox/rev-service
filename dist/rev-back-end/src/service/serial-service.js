"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const board_service_1 = require("./board-service");
const Serialport = require("serialport");
const logger_1 = require("./logger");
/**
 * @classdesc Service that automatically connects to any Firmata compatible devices physically connected to the host.
 * @namespace SerialService
 */
class SerialService extends board_service_1.default {
    /**
     * @constructor
     * @param {Boards} model
     */
    constructor(model) {
        super(model);
        this.namespace = 'serial';
        this.log = new logger_1.default(this.namespace);
        this.unsupportedDevices = [];
        this.log.info(`Listening on serial ports.`);
        this.startListening();
    }
    /**
     * Scans the host's ports every 10 seconds.
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
            const port = ports
                .filter(port => port.manufacturer !== undefined)
                .find(port => port.manufacturer.startsWith("Arduino")); // only allow devices produced by Arduino for now
            // todo: fix this shite
            // don't connect to the same device twice, also ignore devices that don't support Firmata
            if (port && !this.isUnsupported(port.comName)) {
                this.connectToBoard(port.comName, this.handleConnected.bind(this), this.handleDisconnected.bind(this));
            }
        });
    }
    /**
     * Handles a connected board.
     * @param {string} boardId
     */
    handleConnected(boardId) {
        this.log.info(`A new compatible device connected on: ${boardId}.`);
    }
    /**
     * Handles a disconnected board.
     * @param {string} boardId
     */
    handleDisconnected(boardId) {
        if (boardId)
            this.log.info(`A device has disconnected from port ${boardId}.`);
        else
            this.log.info(`A device has failed to connect.`);
        this.log.info(`A device has disconnected from port ${boardId}.`);
        this.removeBoard(boardId);
    }
    /**
     * Returns true if a device is present in the list of unsupported devices.
     * @access private
     * @param {string} port
     * @return {boolean}
     */
    isUnsupported(port) {
        return this.unsupportedDevices.indexOf(port) >= 0;
    }
}
exports.default = SerialService;
//# sourceMappingURL=serial-service.js.map