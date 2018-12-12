import * as args from 'args';

// Enable serial-servers: firmata-radar --serial

export default class Config {
    static options = args
        .option('port', 'Port at which the websocket service will be served. Default: 9000', 9000)
        .option('start-port', 'The starting port in the port-range for Firmata boards. Default: 3030', 3030)
        .option('end-port', 'The end port in the port-range for Firmata boards. Default: 3031', 3031)
        .option('serial', 'Enable serial interface. Default: false', false)
        .option('ethernet', 'Enable ethernet interface. Default: false', false);

    startPort: number;
    s: number;              // startPort alias
    endPort: number;
    e: number;              // endPort alias
    serial: boolean;
    S: boolean;             // serial alias
    ethernet: boolean;
    E: boolean;             // ethernet alias
    port: number;
    p: number;              // port alias
}