export class BoardUnavailableError extends Error {
    constructor(message: string) {
        super(message);

        this.name = 'BoardUnavailableError';
    }
}
