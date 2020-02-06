export class BoardTypeNotFoundError extends Error {
    constructor(message: string) {
        super(message);

        this.name = 'BoardTypeNotFoundError';
    }
}
