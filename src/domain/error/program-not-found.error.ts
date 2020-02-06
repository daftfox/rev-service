export class ProgramNotFoundError extends Error {
    constructor(message: string) {
        super(message);

        this.name = 'ProgramNotFoundError';
    }
}
