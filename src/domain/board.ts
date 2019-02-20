import * as FirmataBoard from 'firmata';
import { BoardStatus, DiscreteBoard } from "../interface/discrete-board";
import Logger from "../service/logger";
import {Command} from "../interface/command";
import BoardError from "./board-error";
import CommandError from "./command-error";

/**
 * Represents a board
 */
class Board implements DiscreteBoard {
    public id:        string;
    public vendorId:  string;
    public productId: string;
    public status:    BoardStatus;
    public type:      string;

    protected AVAILABLE_COMMANDS = {};

    protected namespace: string;
    protected readyListener;
    protected firmataBoard: FirmataBoard;

    constructor( firmataBoard: FirmataBoard, id: string ) {
        this.firmataBoard = firmataBoard;
        this.id = id;

        this.namespace = `board - ${ this.id }`;

        this.readyListener = () => {
            Logger.info( this.namespace, 'Ready to rumble' );
            this.status = BoardStatus.AVAILABLE;
        };

        this.firmataBoard.on( 'ready', this.readyListener );
    }

    public static toDiscrete( board: Board ): DiscreteBoard {
        return {
            id: board.id,
            vendorId: board.vendorId,
            productId: board.productId,
            status: board.status,
            type: board.type
        };
    }

    public static toDiscreteArray( boards: Board[] ): DiscreteBoard[] {
        return boards.map( Board.toDiscrete  );
    }

    public executeCommand( command: Command ) {
        if (!this.isAvailableCommand( command.method )) throw new CommandError( `'${ command.method }' is not a valid command.` );
        try {
            this.AVAILABLE_COMMANDS[ command.method ]( command.parameter );
        } catch ( err ) {
            throw new BoardError( err ) ;
        }
    }

    protected isAvailableCommand( command: string ): boolean {
        return Object.keys( this.AVAILABLE_COMMANDS ).indexOf( command ) >= 0;
    }
}

export default Board;