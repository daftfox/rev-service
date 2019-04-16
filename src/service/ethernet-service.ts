import BoardService from './board-service';
import * as EtherPort from 'etherport';
import Boards from '../model/boards';
import Logger from './logger';
import * as net from 'net';
import NoAvailablePortError from "../error/no-available-port-error";
import EthernetServiceOptions from "../interface/ethernet-service-options";

/**
 * @classdesc An ethernet service that open up a number of ports between in a given port-range
 * and attempts to connect to boards that knock on the proverbial door.
 * @namespace EthernetService
 */
class EthernetService extends BoardService{
    /**
     * @access private
     * @static
     * @type {string}
     */
    private static namespace = `ethernet`;

    private tcpProxy: net.Server;

    private availablePorts: number[];

    /**
     * @constructor
     * @param {Boards} model Data model that implements an addBoard and removeBoard method.
     * @param {EthernetServiceOptions} options
     */
    constructor( model: Boards, options: EthernetServiceOptions ) {
        super( model );

        this.connections = [];
        this.listen( options );
    }

    /**
     * Returns number of available ports left
     * @return {number}
     */
    private getNumberOfAvailablePorts(): number {
        return this.availablePorts.length;
    }

    /**
     * Start listening on the port supplied for the ethernet service through a tcpProxy.
     * @param {EthernetServiceOptions} options
     */
    private listen( options: EthernetServiceOptions ): void {
        Logger.info( EthernetService.namespace, `Listening on port ${options.listenPort}.` );

        this.availablePorts = this.getPortRange( options );
        this.tcpProxy = net.createServer( this.handleConnectionRequest.bind( this ) ).listen( options.listenPort );
    }

    /**
     * Returns an array of booleans mapped to ports that are represented by the array index. An available port is set to true.
     * @return {boolean[]} Array of ports
     */
    private getPortRange( options: EthernetServiceOptions ): number[] {
        const portRange = [];

        for ( let port = options.startPort; port < options.endPort; port ++ ) {
            portRange.push( port );
        }

        return portRange;
    }

    /**
     * Setup a proxy to redirect communication from and to
     * boards from the supplied port to any of the supplied available ports.
     * @param {net.Socket} localSocket
     */
    private handleConnectionRequest( localSocket: net.Socket ): void {
        const availablePort = this.getAvailablePort();

        Logger.debug( EthernetService.namespace, `A new device attempts to connect. Proxying to port ${availablePort}` );

        const etherPort = new EtherPort( availablePort );
        const remoteSocket = new net.Socket().connect( availablePort );

        etherPort.on( 'open', () => {
            Logger.debug( EthernetService.namespace, `Proxy has opened connection to EtherPort instance.` );

            this.connectToBoard(
                etherPort,
                this.handleConnected.bind( this ),
                this.handleDisconnected.bind( this )
            );
        } );

        localSocket.on( 'data', ( data: Buffer ) => {
            Logger.debug( EthernetService.namespace, `<<< Received data from device: [${data.toString('hex')}]` ); // fixme: make data legible

            remoteSocket.write( data );
        } );

        remoteSocket.on( 'data', ( data: Buffer ) => {
            Logger.debug( EthernetService.namespace, `>>> Sending data to device: [${data.toString('hex')}]` ); // fixme: make data legible

            localSocket.write( data );
        } );
    }

    /**
     * Handles a disconnected board.
     * @param {string} boardId
     */
    private handleDisconnected( boardId: string ): void {
        Logger.info( EthernetService.namespace, `Device has disconnected from port ${boardId}.` );

        this.availablePorts.push( parseInt( boardId, 10 ) );
        this.removeConnection( boardId );
    }

    /**
     * Handles a connected board.
     * @param {string} boardId
     */
    private handleConnected( boardId: string ): void {
        Logger.info( EthernetService.namespace, `A new compatible device has connected successfully on: ${boardId}.` );
    }

    /**
     * Returns the first unused port from the list of available ports.
     * @throws NoAvailablePortError
     * @return {number} An unused port from the range of available ports.
     */
    private getAvailablePort(): number {
        if ( !this.getNumberOfAvailablePorts() ) throw new NoAvailablePortError( `No available ports left. Consider increasing the number of available ports.` );
        return this.availablePorts.shift();
    }
}

export default EthernetService;