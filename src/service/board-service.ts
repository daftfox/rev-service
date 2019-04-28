import * as EtherPort from 'etherport';
import Boards from "../model/boards";
import Board from "../domain/board";
import MajorTom from "../domain/major-tom";
import * as FirmataBoard from 'firmata';
import Logger from "./logger";
import * as net from "net";

/**
 * A service that implements method(s) to connect to devices compatible with the firmata protocol.
 *
 * @namespace BoardService
 */
class BoardService {
    /**
     * Local instance of {#link Boards}.
     *
     * @access private
     * @type {Boards}
     */
    protected model: Boards;

    /**
     * Namespace used by the local instance of {@link Logger}
     *
     * @access protected
     * @type {string}
     */
    protected namespace = 'BoardService';

    /**
     * Local instance of the {@link Logger} class.
     *
     * @access protected
     * @type {Logger}
     */
    protected log: Logger;

    /**
     * @constructor
     * @param {Boards} model Data model that implements an addBoard and removeBoard method.
     */
    constructor( model: Boards ) {
        this.model = model;

        this.log = new Logger( this.namespace )
    }

    /**
     * Sets up a connection to a board.
     *
     * @param {EtherPort | string} port An EtherPort object or serial port address
     * @param {function(Board):void} connected Callback for when device successfully connects, containing the {@link Board} instance.
     * @param {function(Board,string):void} disconnected Callback when device disconnects containing the {@link Board} instance and its port.
     */
    protected connectToBoard( port: net.Socket | string, connected?: ( board: Board ) => void, disconnected?: ( board?: Board ) => void ): void {
        let board: Board;
        let id: string;
        let firmataBoard = new FirmataBoard( port, ( err ) => {
            if ( !err ) {
                clearTimeout( connectionTimeout );

                const firmware = firmataBoard.firmware.name.split('_').shift();
                id = firmataBoard.firmware.name.split('_').pop().replace( '.ino', '' );

                this.log.debug( `Firmware of connected device: ${ firmware } v${ firmataBoard.firmware.version.major }.${ firmataBoard.firmware.version.minor }.` );

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
                        board = new MajorTom( firmataBoard, id );
                        break;
                    default:
                        board = new Board( firmataBoard, id );
                }

                connected( board );
                this.model.addBoard( board );
            } else {
                disconnected();
            }

        } );

        /*
         * Set a 10 second timeout.
         * The device is deemed unsupported if a connection could not be made within that period.
         */
        const connectionTimeout = setTimeout( () => {
            this.log.warn( 'Timeout while connecting to board.' );

            board = null;
            firmataBoard.removeAllListeners();
            firmataBoard = null;

            disconnected();
        }, 10000);

        firmataBoard.on( 'error', ( err ) => {
            disconnected( board );
            board = null;
        } );

        firmataBoard.on( 'update', () => {
            this.model.updateBoard( board );
        } );

        firmataBoard.once( 'disconnect', () => {
            this.log.debug( 'Disconnect event received from firmataboard.' );

            disconnected( board );
        } );
    }
}

export default BoardService;