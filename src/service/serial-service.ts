import BoardService from "./board-service";
import Boards from "../model/boards";
import * as Serialport from 'serialport';
import Logger from "./logger";
import EthernetService from "./ethernet-service";

/**
 * @classdesc Service that automatically connects to any Firmata compatible devices physically connected to the host.
 * @namespace SerialService
 */
class SerialService extends BoardService {

    /**
     * Namespace for logging purposes
     * @access private
     * @static
     * @type {string}
     */
    private static namespace = `serial`;

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

        this.connections = [];
        this.unsupportedDevices = [];
        Logger.info( SerialService.namespace, `Listening on serial ports.` );
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
        Serialport.list( ( error: any, ports: SerialPort[] ) => {       // list all connected serial devices

            const port = ports
                .filter( port => port.manufacturer !== undefined )
                .find( port => port.manufacturer.startsWith( "Arduino" ) );      // only allow devices produced by Arduino for now
                                                                                 // todo: fix this shite

            // don't connect to the same device twice, also ignore devices that don't support Firmata
            if ( port && !this.isConnected( port.comName ) && !this.isUnsupported( port.comName ) ) {
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
        Logger.info( SerialService.namespace, `A new compatible device connected on: ${boardId}.` );
        this.connections.push( boardId );
    }

    /**
     * Handles a disconnected board.
     * @param {string} boardId
     */
    private handleDisconnected( boardId: string ): void {
        if ( boardId ) Logger.info( SerialService.namespace, `A device has disconnected from port ${boardId}.` );
        else Logger.info( SerialService.namespace, `A device has failed to connect.` );

        Logger.info( SerialService.namespace, `A device has disconnected from port ${boardId}.` );
        this.removeConnection( boardId );
    }

    /**
     * Returns true if a device has already connected on a specific port or false if not.
     * @access private
     * @param {string} port
     * @return {boolean}
     */
    private isConnected( port: string ): boolean {
        return this.connections.indexOf( port ) >= 0;
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