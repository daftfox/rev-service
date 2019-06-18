import WebSocketError from "./web-socket-error";

class MethodNotAllowed extends WebSocketError {
    constructor( message: string ) {
        super( message );

        this.code = 405;
        this.responseBody.error = `The client has requested to perform an illegal action.`;
    }
}

export default MethodNotAllowed;