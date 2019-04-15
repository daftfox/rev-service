import * as EtherPort from 'etherport';
import Boards from "../model/boards";
import Board from "../domain/board";
import MajorTom from "../domain/major-tom";
import * as FirmataBoard from 'firmata';

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
    private model: Boards;

    /**
     * @access protected
     * @type {string[] | EtherPort[]}
     */
    protected connections: string[] | EtherPort[];

    /**
     * @constructor
     * @param {Boards} model - Data model that implements an addBoard and removeBoard method.
     */
    constructor( model: Boards ) {
        this.model = model;

        this.model.boardDisconnected.subscribe(
            board => this.removeConnection( board.getPort() )
        )
    }

    /**
     * Sets up a connection to a board.
     * @param {EtherPort | string} port - An EtherPort object or serial port address
     * @param {function(boolean):void} connected - Callback for when device successfully connects.
     * @param {function():void} disconnected
     */
    protected connectToBoard( port: EtherPort | string, connected?: ( boolean? ) => void, disconnected?: ( id: string ) => void ): void {
        let board: Board;

        const firmataBoard = new FirmataBoard( port );
        const id = ( typeof port === "object" ? port.path.toString( 10 ) : port );

        /*
         * Set a 10 second timeout.
         * The device is deemed unsupported if a connection could not be made within that period.
         */
        const connectionTimeout = setTimeout( _ => {
            board = null;
            firmataBoard.removeAllListeners(); // "What do we say to the God of memory leaks? Not today."
            disconnected( id );
        }, 10000) ;

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
        firmataBoard.on( 'queryfirmware', () => {
            const type = firmataBoard.firmware.name.replace( '.ino', '' );

            switch (type) {
                case 'MajorTom':
                    board = new MajorTom( firmataBoard, id );
                    break;
                default:
                    board = new Board( firmataBoard, id );
            }
            board.setPort( port );
        } );

        /*
         * A proper connection was made and the board is passed to the callback method.
         */
        firmataBoard.on( 'ready', () => {
            this.model.addBoard( board );
            connected();
            clearTimeout( connectionTimeout );
        } );

        /*
         * Although I have never seen this event getting properly fired, I'm still implementing this.
         * Disconnects usually/only happen when the connection is broken up in an unplanned way.
         * I try to capture disconnected in a different way
         */
        firmataBoard.on( 'disconnect', () => {
            this.model.removeBoard( board );
            disconnected( id );
        } );

        /*
         * The same goes for this one.
         */
        firmataBoard.on('close', () => {
            this.model.removeBoard( board );
            disconnected( id );
        } );
    }

    /**
     * Removes connection from list of stored connections
     * @access protected
     * @param {EtherPort | string} port
     */
    protected removeConnection( port: string ): void {
        this.connections.splice( this.connections.indexOf( port ), 1 );
    }
}

export default BoardService;