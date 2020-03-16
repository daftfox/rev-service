import { MESSAGE_TOPIC } from '../enum';

/**
 * @classdesc A class used to instantiate WebSocket messages
 */
export class Message {
    public topic: MESSAGE_TOPIC;
    public body?: any;

    constructor(topic: MESSAGE_TOPIC, body?: any) {
        this.topic = topic;
        this.body = body;
    }
}
