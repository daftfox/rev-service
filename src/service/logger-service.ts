import Chalk from 'chalk';
import * as moment from 'moment';

/**
 * @classdesc
 * @namespace LoggerService
 */
class LoggerService {
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
        if ( process.env.debug ) console.log( `${ Chalk.black.bgWhite( 'DEBUG' ) } ${ LoggerService.formatMessage( this.namespace, message ) }` )
    }

    /**
     * @access public
     * @param {string} message
     */
    public info( message: string ): void {
        console.info( `${ Chalk.black.bgBlue( ' INFO' ) } ${ LoggerService.formatMessage( this.namespace, message ) }` );
    }

    /**
     * @access public
     * @param {string} message
     */
    public warn( message: string ): void {
        console.warn( `${ Chalk.black.bgYellow( ' WARN' ) } ${ LoggerService.formatMessage( this.namespace, message ) }` );
    }

    /**
     * @access public
     * @param {Error} error
     */
    public error( error: Error | string ): void {
        let errorMessage: string;
        if ( typeof error !== typeof '' ) {
            errorMessage = ( <Error> error ).message.replace( /Error: /g, '' ); // No need to say error three times
        } else {
            errorMessage = <string> error;
        }
        console.error( `${ Chalk.black.bgRed( 'ERROR' ) } ${ LoggerService.formatMessage( this.namespace, errorMessage ) }` );
    }

    /**
     * @access public
     * @param {Error} error
     */
    public stack( error: Error ): void {
        const stack = error.stack.replace( /Error: /g, '' ); // No need to say error three times
        console.log( `${ Chalk.black.bgRed( 'ERROR' ) } ${ LoggerService.formatMessage( this.namespace, stack ) }` );
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
     * @param {boolean} addTimestamp Add timestamp to logged message
     * @returns {string} Formatted message
     */
    private static formatMessage( namespace: string, message: string | Error, addTimestamp: boolean = true ): string {
        return `${ Chalk.red.bold( LoggerService.serviceName ) }:${ Chalk.rgb( 255, 136, 0 ).bold( namespace ) } ${ message } ${ addTimestamp ? LoggerService.getTimestamp() : '' }`;
    }
}

export default LoggerService;