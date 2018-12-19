import BoardService from "./board-service";
import * as EtherPort from 'etherport';
import Boards from '../model/boards';
import Debugger from "debug";

class EthernetService extends BoardService{
    private connections: EtherPort[];
    private debug:       Debugger;

    constructor( model: Boards, startPort: number, endPort: number ) {
        super( model );

        this.connections = [];
        this.debug       = Debugger.debug(`EthernetService`);

        this.listenOnPorts( startPort, endPort );
    }

    private listenOnPorts( startPort: number, endPort: number ) {
        for ( let port = startPort; port <= endPort; port++ ) {

            this.debug( `Listening on port ${port}.` );
            this.connections[ port ] = new EtherPort( port );

            this.connections[ port ].on( 'open', () => {
                this.debug( `A device attempts to connect at port ${port}.` );
                this.connectToBoard( this.connections[ port ] );
            } );
        }
    }
}

export default EthernetService;