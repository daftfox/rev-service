class BoardError extends Error {
    constructor( message: string ) {
        super( message );
    }
}

export default BoardError;