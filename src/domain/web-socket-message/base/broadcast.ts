import { Message } from './message';
import { MESSAGE_TOPIC } from '../enum';

export class Broadcast extends Message {
    constructor(topic: MESSAGE_TOPIC, body?: any) {
        super(topic, body);
    }

    public static fromJSON(json: string): Broadcast {
        const { topic, body } = JSON.parse(json);

        return new Broadcast(topic, new Broadcast(body));
    }

    public toJSON(): string {
        const object = {
            topic: this.topic,
            body: this.body,
        };

        return JSON.stringify(object);
    }
}
