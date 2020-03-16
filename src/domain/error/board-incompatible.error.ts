export class BoardIncompatibleError extends Error {
    constructor(message: string) {
        super(message);

        this.name = 'BoardIncompatibleError';
    }
}
