class CommandUnavailableError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export default CommandUnavailableError;
