import { Event } from './event.model';

export class BoardErrorEvent extends Event {
    error: Error;

    constructor(error: Error) {
        super();

        this.error = error;
    }
}
