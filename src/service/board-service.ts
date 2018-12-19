import * as EtherPort from 'etherport';
import Boards from "../model/boards";
import Board from "../domain/board";

class BoardService {
    private model: Boards;

    constructor(model: Boards) {
        this.model = model;
    }

    /**
     * Consumes a port as either an EtherPort object or serial comName as string.
     * Board will be added to the model once it has been connected to successfully.
     *
     * @param {EtherPort | string} port
     * @param {function} boardConnectedCallback
     */
    protected connectToBoard( port: EtherPort | string, boardConnectedCallback?: (boolean) => void, boardDisconnectedCallback?: () => void ) {
        const board = new Board(port);

        const connectionTimeout = setTimeout( _ => {
            console.log('timeout connecting to board');
            boardConnectedCallback(false);
        }, 10000);

        board.on('ready', () => {

            // device connected and ready
            clearTimeout( connectionTimeout );
            this.model.addBoard( board );
            boardConnectedCallback( true );
        });

        board.on( 'disconnect', () => {
            this.model.removeBoard( board );
            boardDisconnectedCallback()
        });
    }
}

export default BoardService;