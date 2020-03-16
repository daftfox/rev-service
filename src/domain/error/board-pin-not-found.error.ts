export class BoardPinNotFoundError extends Error {
    constructor(message: string) {
        super(message);

        this.name = 'BoardPinNotFoundError';
    }
}
