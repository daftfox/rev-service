class CommandMalformed extends Error {
    constructor( message: string ) {
        super( message );
    }
}

export default CommandMalformed;