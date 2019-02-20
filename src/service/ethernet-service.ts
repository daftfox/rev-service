import BoardService from "./board-service";
import * as EtherPort from 'etherport';
import Boards from '../model/boards';
import Logger from "./logger";
import Board from "../domain/board";
import MajorTom from "../domain/major-tom";

/**
 * @classdesc An ethernet service that open up a number of ports between in a given port-range
 * and attempts to connect to boards that knock on the proverbial door.
 */
class EthernetService extends BoardService{
    /** @access private */
    private connections: EtherPort[];

    /**
     * @access private
     * @static
     */
    private static namespace = `ethernet`;

    /**
     * @constructor
     * @param {Boards} model - Data model that implements an addBoard and removeBoard method.
     * @param {number} startPort - First port in range.
     * @param {number} endPort - Last port in range.
     */
    constructor( model: Boards, startPort: number, endPort: number ) {
        super( model );

        this.connections = [];
        this.listenOnPorts( startPort, endPort );
    }

    /**
     * Initializes listeners for every port between the startPort and endPort
     * @param {number} startPort - First port in range
     * @param {number} endPort - Last port in range
     */
    private listenOnPorts( startPort: number, endPort: number ): void {
        for ( let port = startPort; port <= endPort; port++ ) {

            Logger.info( EthernetService.namespace, `Listening on port ${port}.` );
            this.connections[ port ] = new EtherPort( port );

            this.connections[ port ].on( 'open', () => {
                Logger.info( EthernetService.namespace, `A device attempts to connect at port ${port}.` );
                this.connectToBoard(
                    this.connections[ port ],
                    ( board ) => { // boardConnectedCallback

                        //board.executeCommand( 'BLINKON' );

                        // is there actually something I need to do here?
                    },
                    () => {
                        this.removeConnection( port );
                    }
                );
            } );
        }
    }

    private removeConnection( port: EtherPort ): void {
        this.connections.splice( this.connections.indexOf( port ), 1 );
    }
}

export default EthernetService;