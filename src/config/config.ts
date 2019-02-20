import * as args from 'args';

export default class Config {
    private static flags = args
        .option( 'port',       'Port at which the websocket service will be served.',          80 )
        .option( 'start-port', 'The starting port in the port-range for FirmataBoard boards.', 3030 )
        .option( 'end-port',   'The end port in the port-range for FirmataBoard boards.',      3039 )
        .option( 'verbose',    'Enable verbose logging.',                                      false )
        .option( 'serial',     'Enable serial interface.',                                     false )
        .option( 'ethernet',   'Enable ethernet interface.',                                   false );

    public static parseOptions( flags: any ): Flags {
        return Config.flags.parse( flags )
    }
}

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