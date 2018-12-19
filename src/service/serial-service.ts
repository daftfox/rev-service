import BoardService from "./board-service";
import Boards from "../model/boards";
import Debugger from "debug";
import 'debug';
import * as Serialport from 'serialport';

class SerialService extends BoardService {
    private debug:                 Debugger;
    private connections:           string[];
    private nonFirmataConnections: string[];

    constructor( model: Boards ) {
        super(model);

        this.connections           = [];
        this.nonFirmataConnections = [];
        this.debug                 = Debugger.debug(`SerialService`);
        this.debug(`Listening on serial ports.`);
        this.startListening();
    }

    private startListening() {
        //this.scanSerialPorts();                                      // check for available devices
        setInterval(this.scanSerialPorts.bind(this), 10000)     // and continue to do so every ten seconds
    }

    private scanSerialPorts() {
        Serialport.list( ( error: any, ports: SerialPort[] ) => {       // list all connected serial devices

            const port = ports
                .filter( port => port.manufacturer !== undefined )
                .find( port => port.manufacturer.startsWith( "Arduino" ) );      // only allow devices produced by Arduino for now

            // don't connect to the same device twice, also ignore devices that don't support Firmata
            if ( port && !this.isConnected( port.comName ) && !this.isNonFirmata( port.comName ) ) {
                this.connectToBoard(
                    port.comName,
                    ( successFullyConnectedToBoard ) => {
                        if ( successFullyConnectedToBoard ) {
                            this.connections.push( port.comName );
                        } else {
                            this.nonFirmataConnections.push( port.comName );
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

    private isNonFirmata( port: string ): boolean {
        return this.nonFirmataConnections.indexOf( port ) >= 0;
    }

    private removeConnection( port: string ) {
        this.connections.splice( this.connections.indexOf( port ), 1 );
    }
}

export default SerialService;