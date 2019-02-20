
class CommandError extends Error {
    constructor( message: string ) {
        super( message );
    }
}

export default CommandError;