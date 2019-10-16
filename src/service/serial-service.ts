import ConnectionService from "./connection-service";
import Boards from "../model/boards";
import * as Serialport from 'serialport';
import Logger from "./logger";
import ISerialPort from "../interface/serial-port";
import IBoard from "../interface/board";
import Chalk from "chalk";

/**
 * @description Service that automatically connects to any Firmata compatible devices physically connected to the host.
 * @namespace SerialService
 */
class SerialService extends ConnectionService {

    /**
     * A list of port IDs in which an unsupported device is plugged in.
     * @access private
     * @type {string[]}
     */
    private unsupportedDevices: string[] = [];

    private usedPorts: string[] = [];

    /**
     * @constructor
     * @param {Boards} model
     */
    constructor( model: Boards ) {
        super( model );

        this.namespace = 'serial';
        this.log = new Logger( this.namespace );

        this.log.info( `Listening on serial ports.` );
        this.startListening();
    }

    /**
     * Scans the host's ports every 3 seconds.
     * @access private
     */
    private startListening(): void {
        setInterval( this.scanSerialPorts.bind( this ), 10000 );
    }

    /**
     * Scans serial ports and automatically connects to all compatible devices.
     * @access private
     */
    private scanSerialPorts(): void {
        Serialport.list( ( error: any, ports: ISerialPort[] ) => {       // list all connected serial devices

            const availablePort = ports
                .filter( port => port.productId !== undefined )
                .filter( port => this.usedPorts.indexOf( port.comName ) < 0)
                .filter( port => this.unsupportedDevices.indexOf( port.comName ) < 0).pop();

            if ( availablePort ) {
                this.usedPorts.push( availablePort.comName );
                this.connectToBoard(
                    availablePort.comName,
                    true,
                    ( board: IBoard ) => {
                        this.log.info( `Device ${ Chalk.rgb( 0, 143, 255 ).bold( board.id ) } connected.` );
                    },
                    ( board?: IBoard ) => {

                        this.usedPorts.splice( this.usedPorts.indexOf( availablePort.comName ), 1 );
                        if ( board ) {
                            this.log.info( `Device ${ board.id } disconnected.` );

                            this.model.disconnectBoard( board.id );
                        } else {
                            this.unsupportedDevices.push( availablePort.comName );
                        }
                    }
                );
            }
        } );
    }
}

export default SerialService;
