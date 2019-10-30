import WebSocketError from "./web-socket-error";

class NotFound extends WebSocketError {
    constructor( message: string ) {
        super( message );

        this.code = 404;
        this.responseBody.error = `The requested resource could not be found.`;
    }
}

export default NotFound;