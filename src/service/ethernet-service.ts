import BoardService from './board-service';
import * as EtherPort from 'etherport';
import Boards from '../model/boards';
import Logger from './logger';
import { Server, Socket } from 'net';
import NoAvailablePortError from '../error/no-available-port-error';
import IEthernetServiceOptions from '../interface/ethernet-service-options';
import Chalk from 'chalk';
import Board from '../domain/board';

/**
 * @classdesc An ethernet service that opens up a number of ports between in a given port-range
 * and attempts to connect to boards that knock on the proverbial door.
 * @namespace EthernetService
 */
class EthernetService extends BoardService{

    /**
     * @access private
     * @type {net.Server}
     */
    private tcpProxy: Server;

    /**
     * @access private
     * @type {number[]}
     */
    private availablePorts: number[] = [];

    /**
     * @constructor
     * @param {Boards} model Data model that implements an addBoard and removeBoard method.
     * @param {IEthernetServiceOptions} options
     */
    constructor( model: Boards, options: IEthernetServiceOptions ) {
        super( model );

        this.namespace = 'ethernet';
        this.log = new Logger( this.namespace );

        this.listen( options );
    }

    /**
     * Start listening on the port supplied for the ethernet service through a tcpProxy.
     * @param {IEthernetServiceOptions} options
     */
    private listen( options: IEthernetServiceOptions ): void {
        this.log.info( `Listening on port ${ Chalk.rgb( 240, 240, 30 ).bold( options.listenPort.toString( 10 ) ) }.` );

        this.setPortRange( options );
        this.tcpProxy = new Server( this.handleConnectionRequest.bind( this ) ).listen( options.listenPort );
    }

    /**
     * Setup a proxy to redirect communication from and to
     * boards from the supplied port to any of the supplied available ports.
     * @param {net.Socket} localSocket
     */
    private handleConnectionRequest( localSocket: Socket ): void {
        const availablePort = this.getAvailablePort();
        let board: Board;

        this.log.debug( `Connection attempt. Start proxying to port ${ Chalk.rgb( 0, 143, 255 ).bold( availablePort.toString( 10 ) ) }.` );

        let etherPort = new EtherPort( availablePort );
        let deviceSocket = new Socket().connect( availablePort );

        etherPort.on( 'open', () => {
            this.log.debug( `Proxy connected.` );

            this.connectToBoard(
                etherPort,
                ( _board: Board ) => {
                    board = _board;
                    this.log.info( `Device ${ Chalk.rgb( 0, 143, 255 ).bold( board.id ) } connected.` );
                },
                ( _board: Board, port: string ) => {
                    this.handleDisconnected( _board, port, etherPort );
                    board = null;
                }
            );
        } );

        // send data received from physical device to instance of Board class
        localSocket.on( 'data', ( data: Buffer ) => {
            deviceSocket.write( data );
        } );

        // send data originating from the Board class instance to the physical device
        deviceSocket.on( 'data', ( data: Buffer ) => {
            localSocket.write( data );
        } );

        // connection was lost; remove the Board instance and close the ethernet server
        localSocket.on( 'error', () => {
            this.handleDisconnected( board, availablePort.toString( 10 ), etherPort );
            board = null;
        } );
    }

    /**
     * Handles a disconnected board.
     * @param {Board} board
     * @param {string} port
     * @param {EtherPort} etherPort
     */
    private handleDisconnected( board: Board, port: string, etherPort: EtherPort ): void {
        if ( board ) {
            this.log.info( `Device ${ board.id } disconnected.` );

            this.model.removeBoard( board.id );
            this.availablePorts.unshift( parseInt( port, 10 ) );
        }

        etherPort.server.close();
    }

    /**
     * Returns an array of booleans mapped to ports that are represented by the array index. An available port is set to true.
     * @return {boolean[]} Array of ports
     */
    private setPortRange( options: IEthernetServiceOptions ): void {
        for ( let port = options.startPort; port < options.endPort; port ++ ) {
            this.availablePorts.push( port );
        }
    }

    /**
     * Returns the lowest unused port from the list of available ports.
     * @throws NoAvailablePortError
     * @return {number} An unused port from the range of available ports.
     */
    private getAvailablePort(): number {
        if ( !this.availablePorts.length ) throw new NoAvailablePortError( `No available ports left. Consider increasing the number of available ports.` );
        return this.availablePorts.shift();
    }
}

export default EthernetService;