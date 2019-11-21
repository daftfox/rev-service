import WebSocketMessage from './web-socket-message';
import { MESSAGE_TOPIC } from '../enum/message-topic.enum';
import BroadcastBody from './body/broadcast-body';

export default class WebSocketBroadcast extends WebSocketMessage {
    constructor(topic: MESSAGE_TOPIC, body?: any) {
        super(topic, body);
    }

    public static fromJSON(json: string): WebSocketBroadcast {
        const { topic, body } = JSON.parse(json);

        return new WebSocketBroadcast(topic, new BroadcastBody(body));
    }

    public toJSON(): string {
        const object = {
            topic: this.topic,
            body: this.body,
        };

        return JSON.stringify(object);
    }
}
