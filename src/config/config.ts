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
        .option( 'ethPort', 'Port from which the ethernet service will be served.', 9000 )
        .option( 'debug', 'Enable debug logging.', false )
        .option( 'serial', 'Enable serial interface.', false )
        .option( 'ethernet', 'Enable ethernet interface.', false );

    /**
     * @static
     * @access public
     * @returns {IFlags}
     */
    public static parseOptions( flags: any ): IFlags {
        return Config.flags.parse( flags );
    }
}