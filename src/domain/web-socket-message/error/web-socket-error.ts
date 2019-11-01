class WebSocketError extends Error {
    public code: number;
    public responseBody = {
        error: undefined,
        message: undefined,
    };

    constructor( message: string ) {
        super( message );

        this.responseBody.message = message;
    }
}

export default WebSocketError;