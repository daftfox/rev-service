import BoardService from "./board-service";
import Boards from "../model/boards";
import * as Serialport from 'serialport';
import Logger from "./logger";

class SerialService extends BoardService {
    private static namespace       = `serial`;
    private connections:           string[];
    private unsupportedDevices: string[];

    constructor( model: Boards ) {
        super(model);

        this.connections           = [];
        this.unsupportedDevices = [];
        Logger.info( SerialService.namespace, `Listening on serial ports.` );
        this.startListening();
    }

    private startListening(): void {
        setInterval(this.scanSerialPorts.bind(this), 10000)     // check for new devices every ten seconds
    }

    private scanSerialPorts(): void {
        Serialport.list( ( error: any, ports: SerialPort[] ) => {       // list all connected serial devices

            const port = ports
                .filter( port => port.manufacturer !== undefined )
                .find( port => port.manufacturer.startsWith( "Arduino" ) );      // only allow devices produced by Arduino for now

            // don't connect to the same device twice, also ignore devices that don't support FirmataBoard
            if ( port && !this.isConnected( port.comName ) && !this.isUnsupported( port.comName ) ) {
                this.connectToBoard(
                    port.comName,
                    ( successFullyConnectedToBoard ) => {
                        if ( successFullyConnectedToBoard ) {
                            this.connections.push( port.comName );
                        } else {
                            this.unsupportedDevices.push( port.comName );
                        }
                    }, () => {
                        this.removeConnection( port.comName );
                    }
                );
            }
        } );
    }

    private isConnected( port: string ): boolean {
        return this.connections.indexOf( port ) >= 0;
    }

    private isUnsupported( port: string ): boolean {
        return this.unsupportedDevices.indexOf( port ) >= 0;
    }

    private removeConnection( port: string ): void {
        this.connections.splice( this.connections.indexOf( port ), 1 );
    }
}

export default SerialService;