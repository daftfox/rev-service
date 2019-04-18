import Chalk from 'chalk';
import * as moment from 'moment';

/**
 * @classdesc
 * @namespace Logger
 */
class Logger {
    /**
     * @access private
     * @type {string}
     */
    private static serviceName = `rev`;
    private readonly namespace: string;

    constructor( namespace: string ) {
        this.namespace = namespace;
    }

    /**
     * @access public
     * @param {string} message
     */
    public debug( message: string ): void {
        if ( process.env.debug ) console.log( `${ Chalk.black.bgWhite( 'DEBUG' ) } ${ Logger.formatMessage( this.namespace, message ) }` )
    }

    /**
     * @access public
     * @param {string} message
     */
    public info( message: string ): void {
        console.info( `${ Chalk.black.bgBlue( ' INFO' ) } ${ Logger.formatMessage( this.namespace, message ) }` );
    }

    /**
     * @access public
     * @param {string} message
     */
    public warn( message: string ): void {
        console.warn( `${ Chalk.black.bgYellow( ' WARN' ) } ${ Logger.formatMessage( this.namespace, message ) }` );
    }

    /**
     * @access public
     * @param {Error} error
     */
    public error( error: Error ): void {
        const errorMessage = error.message.replace( /Error: /g, '' ); // No need to say error three times
        console.error( `${ Chalk.black.bgRed( 'ERROR' ) } ${ Logger.formatMessage( this.namespace, errorMessage ) }` );
    }

    /**
     * @access public
     * @param {Error} error
     */
    public stack( error: Error ): void {
        const stack = error.stack.replace( /Error: /g, '' ); // No need to say error three times
        console.log( `${ Chalk.black.bgRed( 'ERROR' ) } ${ Logger.formatMessage( this.namespace, stack ) }` );
    }

    /**
     * @access private
     * @returns {string} Timestamp
     */
    private static getTimestamp(): string {
        return moment().format( 'DD-MM-YYYY HH:mm:ss.SSS' );
    }

    /**
     * @access private
     * @param {string} namespace
     * @param {string | Error} message
     * @param {boolean} timestamp Add timestamp to logged message
     * @returns {string} Formatted message
     */
    private static formatMessage( namespace: string, message: string | Error, timestamp: boolean = true ): string {
        return `${ Chalk.red.bold( Logger.serviceName ) }:${ Chalk.rgb( 255, 136, 0 ).bold( namespace ) } ${ message } ${ timestamp ? Logger.getTimestamp() : '' }`;
    }
}

export default Logger;