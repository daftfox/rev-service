import ICommandEvent from '../interface/command-event';
import IBoardEvent from '../interface/board-event';

/**
 * @classdesc A class used to instantiate WebSocket messages
 */
class WebSocketMessage {
    /**
     *
     *
     * @type WebSocketMessageType
     */
    public type: WebSocketMessageType;
    public payload: IBoardEvent | ICommandEvent;

    constructor( type: WebSocketMessageType, payload: any ) {
        this.type = type;
        this.payload = payload;
    }

    public toString(): string {
        return JSON.stringify( {
            type: this.type,
            payload: this.payload
        } );
    }
}

export enum WebSocketMessageType {
    BOARD_EVENT,
    COMMAND_EVENT,
    PROGRAM_EVENT
}

export default WebSocketMessage;