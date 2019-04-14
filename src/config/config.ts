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
        .option( 'port',       'Port at which the websocket service will be served.',          80 )
        .option( 'start-port', 'The starting port in the port-range for FirmataBoard boards.', 3030 )
        .option( 'end-port',   'The end port in the port-range for FirmataBoard boards.',      3039 )
        .option( 'verbose',    'Enable verbose logging.',                                      false )
        .option( 'serial',     'Enable serial interface.',                                     false )
        .option( 'ethernet',   'Enable ethernet interface.',                                   false );

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
    startPort: number;
    s:         number;              // startPort alias
    endPort:   number;
    e:         number;              // endPort alias
    serial:    boolean;
    S:         boolean;             // serial alias
    verbose:   boolean;
    ethernet:  boolean;
    E:         boolean;             // ethernet alias
    port:      number;
    p:         number;              // port alias
}