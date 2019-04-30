import BoardService from "./board-service";
import Boards from "../model/boards";
import * as Serialport from 'serialport';
import Logger from "./logger";
import ISerialPort from "../interface/serial-port";

/**
 * @classdesc Service that automatically connects to any Firmata compatible devices physically connected to the host.
 * @namespace SerialService
 */
class SerialService extends BoardService {

    /**
     * A list of port IDs in which an unsupported device is plugged in.
     * @access private
     * @type {string[]}
     */
    private unsupportedDevices: string[];

    /**
     * @constructor
     * @param {Boards} model
     */
    constructor( model: Boards ) {
        super( model );

        this.namespace = 'serial';
        this.log = new Logger( this.namespace );

        this.unsupportedDevices = [];
        this.log.info( `Listening on serial ports.` );
        this.startListening();
    }

    /**
     * Scans the host's ports every 10 seconds.
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

            const port = ports
                .filter( port => port.manufacturer !== undefined )
                .find( port => port.manufacturer.startsWith( "Arduino" ) );      // only allow devices produced by Arduino for now
                                                                                 // todo: fix this shite

            // don't connect to the same device twice, also ignore devices that don't support Firmata
            if ( port && !this.isUnsupported( port.comName ) ) {
                this.connectToBoard(
                    port.comName,
                    this.handleConnected.bind( this ),
                    this.handleDisconnected.bind( this )
                );
            }
        } );
    }

    /**
     * Handles a connected board.
     * @param {string} boardId
     */
    private handleConnected( boardId: string ): void {
        this.log.info( `A new compatible device connected on: ${boardId}.` );
    }

    /**
     * Handles a disconnected board.
     * @param {string} boardId
     */
    private handleDisconnected( boardId: string ): void {
        if ( boardId ) this.log.info( `A device has disconnected from port ${boardId}.` );
        else this.log.info( `A device has failed to connect.` );

        this.log.info( `A device has disconnected from port ${boardId}.` );
    }

    /**
     * Returns true if a device is present in the list of unsupported devices.
     * @access private
     * @param {string} port
     * @return {boolean}
     */
    private isUnsupported( port: string ): boolean {
        return this.unsupportedDevices.indexOf( port ) >= 0;
    }
}

export default SerialService;