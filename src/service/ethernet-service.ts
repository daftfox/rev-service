import BoardService from './board-service';
import * as EtherPort from 'etherport';
import Boards from '../model/boards';
import Logger from './logger';
import * as net from 'net';
import NoAvailablePortError from "../error/no-available-port-error";
import EthernetServiceOptions from "../interface/ethernet-service-options";
import Chalk from 'chalk';

/**
 * @classdesc An ethernet service that open up a number of ports between in a given port-range
 * and attempts to connect to boards that knock on the proverbial door.
 * @namespace EthernetService
 */
class EthernetService extends BoardService{

    /**
     * @access private
     * @type {net.Server}
     */
    private tcpProxy: net.Server;

    /**
     * @access private
     * @type {number[]}
     */
    private availablePorts: number[];

    /**
     * @constructor
     * @param {Boards} model Data model that implements an addBoard and removeBoard method.
     * @param {EthernetServiceOptions} options
     */
    constructor( model: Boards, options: EthernetServiceOptions ) {
        super( model );

        this.namespace = 'ethernet';
        this.log = new Logger( this.namespace );

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
        this.log.info( `Listening on port ${ Chalk.rgb( 240, 240, 30 ).bold( options.listenPort.toString( 10 ) ) }.` );

        this.availablePorts = this.getPortRange( options );
        this.tcpProxy = net.createServer( this.handleConnectionRequest.bind( this ) ).listen( options.listenPort );
    }

    /**
     * Setup a proxy to redirect communication from and to
     * boards from the supplied port to any of the supplied available ports.
     * @param {net.Socket} localSocket
     */
    private handleConnectionRequest( localSocket: net.Socket ): void {
        const availablePort = this.getAvailablePort();

        this.log.debug( `Connection attempt. Start proxying to port ${ Chalk.rgb( 0, 143, 255 ).bold( availablePort.toString( 10 ) ) }.` );

        let etherPort = new EtherPort( availablePort );
        let deviceSocket = new net.Socket().connect( availablePort );

        etherPort.on( 'open', () => {
            this.log.debug( `Proxy connected.` );

            this.connectToBoard(
                etherPort,
                this.handleConnected.bind( this ),
                ( boardId: string ) => {
                    this.handleDisconnected( boardId, etherPort );
                }
            );
        } );

        // send data received from physical device to instance of IBoard class
        localSocket.on( 'data', ( data: Buffer ) => {
            deviceSocket.write( data );
        } );

        // send data originating from the IBoard class instance to the physical device
        deviceSocket.on( 'data', ( data: Buffer ) => {
            localSocket.write( data );
        } );

        // connection was lost; remove the IBoard instance and close the ethernet server
        localSocket.on( 'error', () => {
            this.handleDisconnected( availablePort.toString( 10 ), etherPort );
        } );
    }

    /**
     * Handles a disconnected board.
     * @param {string} boardId
     * @param {EtherPort} etherPort
     */
    private handleDisconnected( boardId: string, etherPort: EtherPort ): void {
        if ( boardId ) this.log.info( `Device disconnected from port ${ Chalk.rgb( 0, 143, 255 ).bold( boardId ) }.` );

        etherPort.server.close();
        this.availablePorts.push( parseInt( boardId, 10 ) );

        this.removeBoard( boardId );
    }

    /**
     * Handles a connected board.
     * @param {string} boardId
     */
    private handleConnected( boardId: string ): void {
        this.log.info( `Device connected on port ${Chalk.rgb( 0, 143, 255 ).bold( boardId )}.` );
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
     * Returns the lowest unused port from the list of available ports.
     * @throws NoAvailablePortError
     * @return {number} An unused port from the range of available ports.
     */
    private getAvailablePort(): number {
        if ( !this.getNumberOfAvailablePorts() ) throw new NoAvailablePortError( `No available ports left. Consider increasing the number of available ports.` );
        return this.availablePorts.shift();
    }
}

export default EthernetService;