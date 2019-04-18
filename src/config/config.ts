import * as args from 'args';

/**
 * Configuration
 *
 * @classdesc // todo
 * @namespace Config
 */
export default class Config {

    /** @access private */
    private static flags = args
        .option( 'port', 'Port from which the WebSocket service will be served.', 80 )
        .option( 'ethPort', 'Port from which the ethernet service will be served.', 9000 )
        .option( 'startPort', 'The first port in the range of ports you want to make available for the ethernet service.', 3000 )
        .option( 'endPort', 'The last port in the range of ports you want to make available for the ethernet service.', 3100 )
        .option( 'debug', 'Enable debug logging.', false )
        .option( 'serial', 'Enable serial interface.', false )
        .option( 'ethernet', 'Enable ethernet interface.', false );

    /** @access public */
    public static parseOptions( flags: any ): Flags {
        return Config.flags.parse( flags )
    }
}

/**
 * @interface Flags
 * @namespace Flags
 */
export interface Flags {
    startPort: number; // first port in range of available ports for the ethernet service
    endPort: number; // last port in range of available ports for the ethernet service
    serial: boolean; // enable/disable the serial service
    debug: boolean; // enable/disable debug logging
    ethernet: boolean; // enable/disable the ethernet service
    port: number; // port to bind the WebSocket service to
    ethPort: number; // port to bind the ethernet service to
}