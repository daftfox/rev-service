import WebSocketError from './web-socket-error';

class ServerError extends WebSocketError {
    constructor(message: string) {
        super(message);

        this.code = 500;
        this.responseBody.error = `The server has encountered an error and the requested action could not be completed.`;
    }
}

export default ServerError;
