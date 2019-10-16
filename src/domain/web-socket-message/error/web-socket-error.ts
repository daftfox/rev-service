class WebSocketError extends Error {
    public code: number;
    public responseBody = {
        error: null,
        message: null,
    };

    constructor( message: string ) {
        super( message );

        this.responseBody.message = message;
    }
}

export default WebSocketError;