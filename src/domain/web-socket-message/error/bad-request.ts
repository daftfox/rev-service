import WebSocketError from "./web-socket-error";

class BadRequest extends WebSocketError {
    constructor( message: string ) {
        super( message );

        this.code = 400;
        this.responseBody.error = `The client sent a malformed message which could not get processed.`;
    }
}

export default BadRequest;