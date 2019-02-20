//import * as log from 'node-pretty-log';
import Chalk from 'chalk';
import * as moment from 'moment';

class Logger {
    private static namespace = `rev`;

    public static debug( namespace: string, message: string ): void {
        console.log( `${ Chalk.black.bgWhite( 'DEBUG' ) } ${ Logger.formatMessage( namespace, message ) }` )
    }

    public static info( namespace: string, message: string ): void {
        console.info( `${ Chalk.black.bgBlue( 'INFO' ) } ${ Logger.formatMessage( namespace, message ) }` );
    }

    public static warn( namespace: string, message: string ): void {
        console.warn( `${ Chalk.black.bgYellow( 'WARN' ) } ${ Logger.formatMessage( namespace, message ) }` );
    }

    public static error( namespace: string, message: Error | string ): void {
        console.error( `${ Chalk.black.bgRed( 'ERROR' ) } ${ Logger.formatMessage( namespace, message ) }` );
    }

    private static getTimestamp(): string {
        return moment().format( 'DD-MM-YYYY HH:mm:ss.SSS' );
    }

    private static formatMessage( namespace: string, message: string | Error ): string {
        return `${ Chalk.red.bold( Logger.namespace ) }:${ Chalk.rgb( 255, 136, 0 ).bold( namespace ) } ${ message } ${ Logger.getTimestamp() }`;
    }
}

export default Logger;