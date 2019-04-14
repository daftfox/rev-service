class WrongEncodingError extends Error {
    constructor( message: string ) {
        super( message );
    }
}

export default WrongEncodingError;