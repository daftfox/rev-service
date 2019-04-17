import * as FirmataBoard from 'firmata';
import { BoardStatus, DiscreteBoard } from "../interface/discrete-board";
import Logger from "../service/logger";
import {Command} from "../interface/command";
import CommandError from "../error/command-error";
import * as EtherPort from 'etherport';
import Timeout = NodeJS.Timeout;

/**
 * Generic representation of devices compatible with the firmata protocol.
 *
 * @classdesc
 * @namespace Board
 */
class Board implements DiscreteBoard {
    /**
     * @type {string
     * @access public
     */
    public id: string;

    /**
     * @type {string}
     * @access public
     */
    public vendorId: string;

    /**
     * @type {string}
     * @access public
     */
    public productId: string;

    /**
     * @type {BoardStatus}
     * @access public
     */
    public status: BoardStatus;

    /**
     * @type {string}
     * @access public
     */
    public type: string;

    /**
     * @type {string | EtherPort
     * @access private
     */
    private port: string | EtherPort;

    /**
     * @type {Object}
     * @access protected
     */
    protected AVAILABLE_COMMANDS = {};

    /**
     * @type {string}
     * @access protected
     */
    protected namespace: string;

    /**
     * @access protected
     */
    protected readyListener;

    /**
     * @access protected
     * @type {FirmataBoard}
     */
    protected firmataBoard: FirmataBoard;

    protected intervals: Timeout[];

    protected timeouts: Timeout[];

    /**
     * Creates a new instance of Board and awaits a successful connection before setting its status to READY
     * @constructor
     * @param {FirmataBoard} firmataBoard
     * @param {string} id
     */
    constructor( firmataBoard: FirmataBoard, id: string ) {
        this.firmataBoard = firmataBoard;
        this.id = id;
        this.timeouts = [];
        this.intervals = [];

        this.namespace = `board - ${ this.id }`;

        this.readyListener = () => {
            Logger.info( this.namespace, 'Ready to rumble' );
            this.status = BoardStatus.READY;
        };

        this.firmataBoard.on( 'ready', this.readyListener );
    }

    /**
     * Return a minimal representation of the Board class
     * @static
     * @access public
     * @param {Board} board
     * @returns {DiscreteBoard} A small object representing a Board instance, but without the overhead and methods.
     */
    public static toDiscrete( board: Board ): DiscreteBoard {
        return {
            id: board.id,
            vendorId: board.vendorId,
            productId: board.productId,
            status: board.status,
            type: board.type
        };
    }

    /**
     * Return an array of DiscreteBoards
     * @static
     * @access public
     * @param {Board[]} boards
     * @returns {DiscreteBoard[]}
     */
    public static toDiscreteArray( boards: Board[] ): DiscreteBoard[] {
        return boards.map( Board.toDiscrete  );
    }

    /**
     * Set port
     *
     * @access public
     * @param {string | EtherPort} port
     */
    public setPort( port: string | EtherPort ): void {
        this.port = port;
    }

    /**
     * Get port
     *
     * @access public
     * @returns {string | EtherPort}
     */
    public getPort(): string | EtherPort {
        return this.port;
    }

    /**
     * Execute a command
     *
     * @access public
     * @param {Command} command
     */
    public executeCommand( command: Command ) {
        if ( !this.isAvailableCommand( command ) ) throw new CommandError( `'${ command.method }' is not a valid command.` );
        this.AVAILABLE_COMMANDS[ command.method ]( command.parameter );
    }

    /**
     * Set status
     *
     * @access public
     * @param {BoardStatus} status
     */
    public setStatus( status: BoardStatus ) {
        this.status = status;
    }

    public clearAllTimers(): void {
        this.clearAllIntervals();
        this.clearAllTimeouts();
    }

    protected clearInterval( interval: Timeout ): void {
        clearInterval( this.intervals.find( _interval => _interval === interval ) );
        this.intervals.splice( this.intervals.indexOf( interval ), 1 );
    }

    protected clearTimeout( timeout: Timeout ): void {
        clearTimeout( this.timeouts.find( _timeout => _timeout === timeout ) );
        this.timeouts.splice( this.timeouts.indexOf( timeout ), 1 );
    }

    private clearAllIntervals(): void {
        this.intervals.forEach( interval => clearInterval( interval ) );
        this.intervals = [];
    }

    private clearAllTimeouts(): void {
        this.timeouts.forEach( timeout => clearTimeout( timeout ) );
        this.timeouts = [];
    }

    /**
     * Check if the command received is an actual valid command
     *
     * @access private
     * @param {Command} command The command to check for availability
     * @returns {boolean} True if the command is valid, false if not
     */
    private isAvailableCommand( command: Command ): boolean {
        return Object.keys( this.AVAILABLE_COMMANDS ).indexOf( command.method ) >= 0;
    }
}

export default Board;