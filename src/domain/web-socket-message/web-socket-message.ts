import { MESSAGE_TOPIC } from '../enum/message-topic.enum';

/**
 * @classdesc A class used to instantiate WebSocket messages
 */
class WebSocketMessage {
    public topic: MESSAGE_TOPIC;
    public body?: any;

    constructor(topic: MESSAGE_TOPIC, body?: any) {
        this.topic = topic;
        this.body = body;
    }
}

export default WebSocketMessage;
