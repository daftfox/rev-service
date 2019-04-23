import * as EtherPort from 'etherport';
import Boards from "../model/boards";
import Board from "../domain/board";
import MajorTom from "../domain/major-tom";
import * as FirmataBoard from 'firmata';
import Logger from "./logger";

/**
 * A basic board-service that implements a connectToBoard method
 * @classdesc // todo
 * @namespace BoardService
 */
class BoardService {
    /**
     * @access private
     * @type {Boards}
     */
    protected model: Boards;

    /**
     * @access protected
     * @type {string}
     */
    protected namespace = 'BoardService';

    /**
     * @access protected
     * @type {Logger}
     */
    protected log: Logger;

    /**
     * @constructor
     * @param {Boards} model - Data model that implements an addBoard and removeBoard method.
     */
    constructor( model: Boards ) {
        this.model = model;

        this.log = new Logger( this.namespace )
    }

    /**
     * Sets up a connection to a board.
     * @param {EtherPort | string} port An EtherPort object or serial port address
     * @param {function(string):void} connected Callback for when device successfully connects.
     * @param {function(string):void} disconnected Callback when device disconnects
     */
    protected connectToBoard( port: EtherPort | string, connected?: ( board: Board ) => void, disconnected?: ( board: Board, port?: string ) => void ): void {
        let board: Board;
        let id: string;

        const firmataBoard = new FirmataBoard( port );
        const _port = ( typeof port === "object" ? port.path : port );

        /*
         * Set a 10 second timeout.
         * The device is deemed unsupported if a connection could not be made within that period.
         */
        const connectionTimeout = setTimeout( _ => {
            this.log.warn( 'Timeout while connecting to board.' );
            board = null;
            firmataBoard.removeAllListeners(); // "What do we say to the God of memory leaks? Not today."
            disconnected( null, _port );
        }, 10000);

        /*
         * I perform some dark magic here.
         * As there are standard devices that offer functionality, I take a look at the name of the firmware that
         * was installed. By default an instance of Board is created, but with these standard devices I instantiate
         * an object of its corresponding class.
         *
         * The firmware name is defined by the name of the Arduino sketch.
         * For now the following devices have a tailor made class:
         * - Major Tom ( MajorTom.ino )
         */
        firmataBoard.once( 'queryfirmware', () => {
            const firmware = firmataBoard.firmware.name.split('_').shift();
            id = firmataBoard.firmware.name.split('_').pop().replace( '.ino', '' );
            this.log.debug( `Firmware of connected device: ${ firmware } v${firmataBoard.firmware.version.major}.${firmataBoard.firmware.version.minor}.` );

            switch (firmware) {
                case 'MajorTom':
                    board = new MajorTom( firmataBoard, id );
                    break;
                default:
                    board = new Board( firmataBoard, id );
            }
        } );

        /*
         * A proper connection was made and the board is passed to the callback method.
         */
        firmataBoard.once( 'ready', () => {
            this.model.addBoard( board );
            clearTimeout( connectionTimeout );
            connected( board );
        } );

        firmataBoard.on( 'update', () => {
            this.model.updateBoard( board );
        } );

        firmataBoard.once( 'disconnect', () => {
            this.log.debug( 'Disconnect event received from firmataboard.' );
            disconnected( board, _port );
        } );
    }
}

export default BoardService;