export class ArchitectureUnsupportedError extends Error {
    constructor(message: string) {
        super(message);

        this.name = 'ArchitectureUnsupportedError';
    }
}
