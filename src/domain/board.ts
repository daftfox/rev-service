import * as Firmata from 'firmata';
import * as EtherPort from 'etherport';
import Debugger from "debug";

class Board extends Firmata {
    id:        string;
    vendorId:  string;
    productId: string;
    port:      any;
    status:    BoardStatus;
    debug:     Debugger;

    constructor( port: string );
    constructor( port: EtherPort ) {
        super( port );

        if ( typeof port === "object" ) {
            this.id = port; // todo: Check what the EtherPort object looks like. Need wifi enabled MCU for this
        } else {
            this.id = port;
        }

        this.debug = new Debugger.debug( `Board - ${this.id}` );
        this.on( 'ready', () => {
            this.debug( 'Ready to rumble' );
            this.status = BoardStatus.AVAILABLE;
        } );

        this.on( 'disconnect', () => {
            this.status = BoardStatus.DISCONNECTED;
        } )
    }

    public static minify( board: Board ): object {
        return {
            id: board.id,
            vendorId: board.vendorId,
            productId: board.productId,
            state: board.status
        };
    }

    public static minifyArray( boards: Board[] ) : object[] {
        return boards.map( board => {
            return {
                id: board.id,
                vendorId: board.vendorId,
                productId: board.productId,
                state: board.status
            }
        }  )
    }
}

export enum BoardStatus {
    AVAILABLE,
    OCCUPIED,
    ERROR,
    DISCONNECTED
}

export default Board;