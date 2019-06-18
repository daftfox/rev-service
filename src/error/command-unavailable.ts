class CommandUnavailable extends Error {
    constructor( message: string ) {
        super( message );
    }
}

export default CommandUnavailable;