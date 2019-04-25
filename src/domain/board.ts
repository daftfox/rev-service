import * as FirmataBoard from 'firmata';
import Logger from "../service/logger";
import CommandError from "../error/command-error";
import Timeout = NodeJS.Timeout;
import Chalk from 'chalk';
import IBoard from "../interface/board";
import IPinout from "../interface/pinout";


/**
 * Generic representation of devices compatible with the firmata protocol.
 *
 * @classdesc
 * @namespace Board
 */
class Board implements Board {
    /**
     * @type {string
     * @access public
     */
    public id: string;

    /**
     * The interval at which to send out a heartbeat
     * @static
     * @access private
     * @type {number}
     */
    private static readonly heartbeatInterval = 3000;

    /**
     * @access protected
     * @type {Logger}
     */
    protected log: Logger;

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
     * @type {string}
     * @access public
     */
    public type: string;

    /**
     * The availableActions property is used to map available methods to string representations so we can easily
     * validate and call them from elsewhere. The mapping should be obvious.
     * @type {Object}
     * @access protected
     */
    protected availableActions = {
        BLINKON: () => { this.enableBlinkLed( true ); this.currentJob = "BLINKON" },
        BLINKOFF: () => { this.enableBlinkLed( false ); this.resetCurrentJob() },
        TOGGLELED: () => { this.toggleLED() },
    };

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
     * The ID of the interval that's executed when we blink the builtin LED.
     * @access private
     */
    private blinkInterval;

    /**
     * @access protected
     * @type {FirmataBoard}
     */
    protected firmataBoard: FirmataBoard;

    /**
     * @access protected
     * @type {Timeout[]}
     */
    protected intervals: Timeout[] = [];

    /**
     * @access protected
     * @type {Timeout[]}
     */
    protected timeouts: Timeout[] = [];

    public currentJob: string = "IDLE";

    // defaulted to Wemos D1 mini pinout for now
    protected pinout: IPinout = {
        LED: 2,
        RX: 13,
        TX: 15
    };

    /**
     * Creates a new instance of Board and awaits a successful connection before setting its status to READY
     * @constructor
     * @param {FirmataBoard} firmataBoard
     * @param {string} id
     */
    constructor( firmataBoard: FirmataBoard, id: string ) {
        this.firmataBoard = firmataBoard;
        this.id = id;
        this.type = this.constructor.name;

        this.readyListener = () => {
            this.namespace = `board_${ this.id }`;
            this.log = new Logger( this.namespace );

            this.log.info( 'Ready' );
            this.startHeartbeat();
        };

        this.firmataBoard.on( 'ready', this.readyListener );
    }

    public getAvailableActions(): string[] {
        return Object.keys( this.availableActions );
    }

    public setPinout( pinout: IPinout ): void {
        Object.assign( this.pinout, pinout );
    }

    /**
     * Return a minimal representation of the Board class
     * @static
     * @access public
     * @param {Board} board
     * @returns {Board} A small object representing a Board instance, but without the overhead and methods.
     */
    public static toDiscrete( board: Board ): IBoard {
        return {
            id: board.id,
            vendorId: board.vendorId,
            productId: board.productId,
            type: board.type,
            currentJob: board.currentJob,
            commands: board.getAvailableActions()
        };
    }

    /**
     * Return an array of DiscreteBoards
     * @static
     * @access public
     * @param {Board[]} boards
     * @returns {Board[]}
     */
    public static toDiscreteArray( boards: Board[] ): IBoard[] {
        return boards.map( Board.toDiscrete );
    }

    /**
     * Execute a command
     *
     * @access public
     * @param {string} action
     * @param {string} parameter
     */
    public executeCommand( action: string, parameter: string ) {
        this.log.debug( `Executing method ${ Chalk.rgb( 67,230,145 ).bold( action ) }.` );
        if ( !this.isAvailableAction( action ) ) throw new CommandError( `'${ Chalk.rgb( 67,230,145 ).bold( action ) }' is not a valid command.` );
        this.availableActions[ action ]( parameter );
        this.firmataBoard.emit( 'update' );
    }

    /**
     * Clear all timeouts and intervals. This is required when a physical device is disconnected.
     */
    public clearAllTimers(): void {
        this.clearAllIntervals();
        this.clearAllTimeouts();
        this.firmataBoard.removeAllListeners();
    }

    /**
     * Clear an interval that was set by this Board instance.
     * @param {NodeJS.Timeout} interval
     */
    protected clearInterval( interval: Timeout ): void {
        clearInterval( this.intervals.find( _interval => _interval === interval ) );
        this.intervals.splice( this.intervals.indexOf( interval ), 1 );
    }

    /**
     * Clear a timeout that was set by this Board instance.
     * @param {NodeJS.Timeout} timeout
     */
    protected clearTimeout( timeout: Timeout ): void {
        clearTimeout( this.timeouts.find( _timeout => _timeout === timeout ) );
        this.timeouts.splice( this.timeouts.indexOf( timeout ), 1 );
    }

    /**
     * Clear all intervals set by this Board instance.
     */
    private clearAllIntervals(): void {
        this.intervals.forEach( interval => clearInterval( interval ) );
        this.intervals = [];
    }

    /**
     * Clear all timeouts set by this Board instance
     */
    private clearAllTimeouts(): void {
        this.timeouts.forEach( timeout => clearTimeout( timeout ) );
        this.timeouts = [];
    }

    /**
     * Enable or disable the builtin LED blinking
     *
     * @param {boolean} enable
     * @access protected
     */
    protected enableBlinkLed( enable: boolean ) {
        if ( enable ) {
            if ( this.blinkInterval ) {
                this.log.warn( `LED blink is already enabled.` );
                return;
            }
            this.blinkInterval = setInterval( this.toggleLED.bind( this ), 500);
            this.intervals.push( this.blinkInterval );
        } else {
            this.clearInterval( this.blinkInterval );
            this.blinkInterval = null;
            this.firmataBoard.digitalWrite( this.pinout.LED, FirmataBoard.PIN_STATE.HIGH ); // high === low???
        }
    }

    /**
     * @access protected
     */
    protected toggleLED(): void {
        this.firmataBoard.digitalWrite( this.pinout.LED, this.firmataBoard.pins[ this.pinout.LED ].value === FirmataBoard.PIN_STATE.HIGH ? FirmataBoard.PIN_STATE.LOW : FirmataBoard.PIN_STATE.HIGH );
    }

    /**
     * Starts an interval requesting the physical board to send its firmware version every 10 seconds.
     * Emits a disconnect event on its FirmataBoard instance if the device fails to respond within 2 seconds of this query being sent.
     * @return {void}
     */
    protected startHeartbeat() {
        const heartbeat = setInterval( () => {

            // set a timeout to emit a disconnect event if the physical device doesn't reply within 2 seconds
            const heartbeatTimeout = setTimeout( () => {
                this.log.warn( `Heartbeat timeout.` );
                this.firmataBoard.emit( 'disconnect' );
                this.clearInterval( heartbeat );
                this.clearTimeout( heartbeatTimeout );
            }, 2000 );

            this.timeouts.push( heartbeatTimeout );

            // we utilize the queryFirmware method to emulate a heartbeat
            this.firmataBoard.queryFirmware( () => {

                // heartbeat received
                // this.log.debug( `${ Chalk.rgb( 230,67,67 ).bold( '❤' ) }` );
                this.firmataBoard.emit( 'update' );
                this.clearTimeout( heartbeatTimeout );
            } );
        }, Board.heartbeatInterval );
        this.intervals.push ( heartbeat );
    }

    protected resetCurrentJob(): void {
        this.currentJob = "IDLE";
    }

    /**
     * Check if the command received is a valid command
     * @access private
     * @param {string} action The command to check for availability
     * @returns {boolean} True if the command is valid, false if not
     */
    private isAvailableAction( action: string ): boolean {
        return this.getAvailableActions().indexOf( action ) >= 0;
    }
}

export default Board;