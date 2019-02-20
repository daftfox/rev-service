import * as FirmataBoard from 'firmata';
import { BoardStatus, DiscreteBoard } from "../interface/discrete-board";
import Logger from "../service/logger";

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

    // constructor( port: string );
    // constructor( port: EtherPort ) {
    //     this.port = port;
    //     this.firmataBoard = new FirmataBoard( port, { skipCapabilities: false } );
    //
    //     if ( typeof port === "object" ) {
    //         this.id = port.path.split(': ')[ 1 ]; // extract port address
    //     } else {
    //         this.id = port;
    //     }
    //     this.namespace = `board - ${ this.id }`;
    //
    //     this.firmataBoard.on( 'ready', () => {
    //         Logger.info( this.namespace, 'Ready to rumble' );
    //         this.status = BoardStatus.AVAILABLE;
    //     } );
    //
    //     this.firmataBoard.on( 'queryfirmware', () => {
    //         this.type = this.firmataBoard.firmware.name.replace( '.ino', '' );
    //     } );
    //
    //     this.firmataBoard.on( 'disconnect', () => {
    //         Logger.info( this.namespace, 'Disconnected' );
    //         this.status = BoardStatus.DISCONNECTED;
    //     } )
    // }

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

    public executeCommand( command: string, param?: string ) {
        if (!this.isAvailableCommand( command )) throw new Error(`'${ command }' is not a valid command.`);
        try {
            this.AVAILABLE_COMMANDS[command](param)
        } catch ( err ) {
            throw new Error( err ) ;
        }
    }

    protected isAvailableCommand( command: string ): boolean {
        return Object.keys(this.AVAILABLE_COMMANDS).indexOf( command ) >= 0;
    }
}

export default Board;