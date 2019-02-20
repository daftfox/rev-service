//import * as log from 'node-pretty-log';
import Chalk from 'chalk';
import * as moment from 'moment';

class Logger {
    private static namespace = `rev`;

    public static debug( namespace: string, message: string ): void {
        if ( process.env.verbose !== '' ) console.log( `${ Chalk.black.bgWhite( 'DEBUG' ) } ${ Logger.formatMessage( namespace, message ) }` )
    }

    public static info( namespace: string, message: string ): void {
        if ( process.env.verbose !== '' ) console.info( `${ Chalk.black.bgBlue( ' INFO' ) } ${ Logger.formatMessage( namespace, message ) }` );
    }

    public static warn( namespace: string, message: string ): void {
        console.warn( `${ Chalk.black.bgYellow( ' WARN' ) } ${ Logger.formatMessage( namespace, message ) }` );
    }

    public static error( namespace: string, error: Error ): void {
        const errorMessage = error.message.replace( /Error: /g, '' ); // No need to say error three times
        console.error( `${ Chalk.black.bgRed( 'ERROR' ) } ${ Logger.formatMessage( namespace, errorMessage ) }` );
    }

    public static stack( namespace: string, error: Error ): void {
        const stack = error.stack.replace( /Error: /g, '' ); // No need to say error three times
        console.log( `${ Chalk.black.bgRed( 'ERROR' ) } ${ Logger.formatMessage( namespace, stack ) }` );
    }

    private static getTimestamp(): string {
        return moment().format( 'DD-MM-YYYY HH:mm:ss.SSS' );
    }

    private static formatMessage( namespace: string, message: string | Error, timestamp: boolean = true ): string {
        return `${ Chalk.red.bold( Logger.namespace ) }:${ Chalk.rgb( 255, 136, 0 ).bold( namespace ) } ${ message } ${ timestamp ? Logger.getTimestamp() : '' }`;
    }
}

export default Logger;