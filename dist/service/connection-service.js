"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const FirmataBoard = require("firmata");
const logger_1 = require("./logger");
/**
 * A service that implements method(s) to connect to devices compatible with the firmata protocol.
 *
 * @namespace ConnectionService
 */
class ConnectionService {
    /**
     * @constructor
     * @param {Boards} model - Data model.
     */
    constructor(model) {
        /**
         * Namespace used by the local instance of {@link Logger}
         *
         * @access protected
         * @type {string}
         */
        this.namespace = 'ConnectionService';
        this.model = model;
        this.log = new logger_1.default(this.namespace);
    }
    /**
     * Sets up a connection to a board.
     *
     * @param {net.Socket} port - An EtherPort object or serial port address
     * @param {function(IBoard):void} [connected] - Callback for when device successfully connects, containing an object implementing the {@link IBoard} interface.
     * @param {function(IBoard):void} [disconnected] - Callback when device disconnects containing an object implementing the {@link IBoard} interface.
     */
    connectToBoard(port, serialConnection, connected, disconnected) {
        let connectedBoard;
        let id;
        let firmataBoard = new FirmataBoard(port);
        /*
         * Set a 10 second timeout.
         * The device is deemed unsupported if a connection could not be made within that period.
         */
        const connectionTimeout = setTimeout(() => {
            this.log.warn('Timeout while connecting to device.');
            connectedBoard = null;
            firmataBoard.removeAllListeners();
            firmataBoard = null;
            disconnected();
        }, 10000);
        const connectionEstablished = () => __awaiter(this, void 0, void 0, function* () {
            clearTimeout(connectionTimeout);
            /*
             * The type and ID are defined by the name of the Arduino sketch file.
             * For now the following devices have a tailor made class:
             * - Major Tom ( MajorTom_<unique_identifier>.ino )
             */
            const type = firmataBoard.firmware.name.split('_').shift();
            id = firmataBoard.firmware.name.split('_').pop().replace('.ino', '');
            // add connected device to list of available devices and / or persist to the data storage if new
            connectedBoard = yield this.model.addBoard(id, type, firmataBoard, serialConnection);
            // callback to connection interface service
            connected(connectedBoard);
        });
        firmataBoard.on('ready', connectionEstablished.bind(this));
        firmataBoard.on('error', (err) => {
            disconnected(connectedBoard);
            connectedBoard = null;
        });
        firmataBoard.on('update', (boardUpdates) => {
            this.model.updateBoard(boardUpdates);
        });
        firmataBoard.once('disconnect', () => {
            this.log.debug('Disconnect event received from firmataboard.');
            connectedBoard = null;
            disconnected(connectedBoard);
            this.model.disconnectBoard(id);
        });
    }
}
exports.default = ConnectionService;
//# sourceMappingURL=connection-service.js.map