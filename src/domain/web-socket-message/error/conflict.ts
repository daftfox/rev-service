import WebSocketError from './web-socket-error';

class Conflict extends WebSocketError {
    constructor(message: string) {
        super(message);

        this.code = 409;
        this.responseBody.error = `The request could not be completed due to a conflict.`;
    }
}

export default Conflict;
