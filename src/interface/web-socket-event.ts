class WebSocketEvent {
    type: WebSocketEventType;
    payload: any;

    constructor( type: WebSocketEventType, payload: any ) {
        this.type = type;
        this.payload = payload;
    }

    public toString() {
        return JSON.stringify( {
            type: this.type,
            payload: this.payload
        } );
    }
}

export enum WebSocketEventType {
    ADD_BOARD,
    REMOVE_BOARD,
    UPDATE_ALL_BOARDS,
    EXECUTE_PROGRAM
}

export default WebSocketEvent;