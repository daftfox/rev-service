import * as args from 'args';
import IFlags from '../interface/flags';

/**
 * Configuration
 *
 * @classdesc // todo
 * @namespace Config
 */
export default class Config {

    /**
     * @static
     * @access private
     */
    private static flags = args
        .option( 'port', 'Port from which the WebSocket service will be served.', 3001 )

        // If you intend to use the provided firmware without changing any of its parameters, don't touch the setting below!
        .option( 'ethernetPort', 'Port from which the ethernet service will be served.', 9000 )
        .option( 'debug', 'Enable debug logging.', false )
        .option( 'serial', 'Enable serial interface.', true )
        .option( 'ethernet', 'Enable ethernet interface.', true )
        .option( 'dbSchema', 'The default schema to use', 'rev' )
        .option( 'dbHost', 'The database server\'s address.', 'localhost' )
        .option( 'dbPort', 'Port on which the database server is running.', 3306 )
        .option( 'dbUsername', 'Username to log in to database server.', '' )
        .option( 'dbPassword', 'Password to log in to database server.', '' )
        .option( 'dbDialect', 'The database server\'s dialect (mysql, postgres, mariadb, sqlite, mssql).', 'sqlite' )
        .option( 'dbPath', 'Path to database file (optional, only for sqlite).', 'database/rev.db' );

    /**
     * @static
     * @access public
     * @returns {IFlags}
     */
    public static parseOptions( flags: any ): IFlags {
        return Config.flags.parse( flags );
    }
}