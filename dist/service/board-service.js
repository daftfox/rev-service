"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const board_1 = require("../domain/board");
const major_tom_1 = require("../domain/major-tom");
const FirmataBoard = require("firmata");
const logger_1 = require("./logger");
/**
 * A service that implements method(s) to connect to devices compatible with the firmata protocol.
 *
 * @namespace BoardService
 */
class BoardService {
    /**
     * @constructor
     * @param {Boards} model Data model that implements an addBoard and removeBoard method.
     */
    constructor(model) {
        /**
         * Namespace used by the local instance of {@link Logger}
         *
         * @access protected
         * @type {string}
         */
        this.namespace = 'BoardService';
        this.model = model;
        this.log = new logger_1.default(this.namespace);
    }
    /**
     * Sets up a connection to a board.
     *
     * @param {EtherPort | string} port An EtherPort object or serial port address
     * @param {function(Board):void} connected Callback for when device successfully connects, containing the {@link Board} instance.
     * @param {function(Board,string):void} disconnected Callback when device disconnects containing the {@link Board} instance and its port.
     */
    connectToBoard(port, connected, disconnected) {
        let board;
        let id;
        let firmataBoard = new FirmataBoard(port, (err) => {
            if (!err) {
                clearTimeout(connectionTimeout);
                const firmware = firmataBoard.firmware.name.split('_').shift();
                id = firmataBoard.firmware.name.split('_').pop().replace('.ino', '');
                this.log.debug(`Firmware of connected device: ${firmware} v${firmataBoard.firmware.version.major}.${firmataBoard.firmware.version.minor}.`);
                /*
                 * I perform some dark magic here.
                 * As there are standard devices that offer functionality, I take a look at the name of the firmware that
                 * was installed. By default an instance of Board is created, but with these standard devices I instantiate
                 * an object of its corresponding class.
                 *
                 * The firmware name and ID are defined by the name of the Arduino sketch.
                 * For now the following devices have a tailor made class:
                 * - Major Tom ( MajorTom_<unique_identifier>.ino )
                 */
                switch (firmware) {
                    case 'MajorTom':
                        board = new major_tom_1.default(firmataBoard, id);
                        break;
                    default:
                        board = new board_1.default(firmataBoard, id);
                }
                connected(board);
                this.model.addBoard(board);
            }
            else {
                disconnected();
            }
        });
        /*
         * Set a 10 second timeout.
         * The device is deemed unsupported if a connection could not be made within that period.
         */
        const connectionTimeout = setTimeout(() => {
            this.log.warn('Timeout while connecting to board.');
            board = null;
            firmataBoard.removeAllListeners();
            firmataBoard = null;
            disconnected();
        }, 10000);
        firmataBoard.on('error', (err) => {
            disconnected(board);
            board = null;
        });
        firmataBoard.on('update', () => {
            this.model.updateBoard(board);
        });
        firmataBoard.once('disconnect', () => {
            this.log.debug('Disconnect event received from firmataboard.');
            disconnected(board);
        });
    }
}
exports.default = BoardService;
//# sourceMappingURL=board-service.js.map