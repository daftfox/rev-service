import BoardService from './board-service';
import Boards from '../model/boards';
import Logger from './logger';
import { Server, Socket } from 'net';
import Chalk from 'chalk';
import Board from '../domain/board';

/**
 * @classdesc An ethernet service that opens a socket and attempts to connect to boards that knock on the proverbial door.
 * @namespace EthernetService
 */
class EthernetService extends BoardService{

    /**
     * @access private
     * @type {net.Server}
     */
    private server: Server;

    /**
     * @constructor
     * @param {Boards} model Data model that implements an addBoard and removeBoard method.
     * @param {number} port
     */
    constructor( model: Boards, port: number ) {
        super( model );

        this.namespace = 'ethernet';
        this.log = new Logger( this.namespace );

        this.listen( port );
    }

    /**
     * Start listening on the port supplied for the ethernet service.
     * @param {number} port
     */
    private listen( port: number ): void {
        this.log.info( `Listening on port ${ Chalk.rgb( 240, 240, 30 ).bold( port.toString( 10 ) ) }.` );

        this.server = new Server( this.handleConnectionRequest.bind( this ) ).listen( port );
        this.server.on( 'error', console.log );
    }

    /**
     * Handle new connection requests and connect to the board.
     *
     * @param {net.Socket} socket
     * @returns {void}
     */
    private handleConnectionRequest( socket: Socket ): void {
        let board: Board;

        this.log.debug( `New connection attempt.` );

        this.connectToBoard(
            socket,
            ( _board: Board ) => {
                board = _board;
                this.log.info( `Device ${ Chalk.rgb( 0, 143, 255 ).bold( board.id ) } connected.` );
            },
            ( _board: Board ) => {
                board = null;
                this.handleDisconnected( socket, _board );
            }
        );
    }

    /**
     * Handles a disconnected board.
     *
     * @param {net.Socket} socket
     * @param {Board} board
     * @returns {void}
     */
    private handleDisconnected( socket: Socket, board?: Board ): void {
        socket.end();
        socket.destroy();

        if ( board ) {
            this.log.info( `Device ${ board.id } disconnected.` );

            this.model.removeBoard( board.id );
        }
    }
}

export default EthernetService;