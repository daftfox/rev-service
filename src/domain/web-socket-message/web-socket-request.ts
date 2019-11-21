import WebSocketMessage from './web-socket-message';
import { MESSAGE_TOPIC } from '../enum/message-topic.enum';
import * as uuid from 'uuid';
import BoardRequestBody from './body/board-request-body';
import IBoardRequestBody from '../interface/board-request-body.interface';
import ProgramRequestBody from './body/program-request-body';
import CommandRequestBody from './body/command-request-body';
import IProgramRequestBody from '../interface/program-request-body.interface';
import ICommandRequestBody from '../interface/command-request-body.interface';

export default class WebSocketRequest extends WebSocketMessage {
    public id: string;

    constructor(topic: MESSAGE_TOPIC, id?: string, body?: BoardRequestBody | ProgramRequestBody | CommandRequestBody) {
        super(topic, body);

        this.id = id || uuid.v4();
    }

    public static fromJSON(json: string): WebSocketRequest {
        const { id, topic, body } = JSON.parse(json);
        let bodyInstance: any;

        switch (topic) {
            case MESSAGE_TOPIC.BOARD:
                bodyInstance = new BoardRequestBody(body as IBoardRequestBody);
                break;
            case MESSAGE_TOPIC.PROGRAM:
                bodyInstance = new ProgramRequestBody(body as IProgramRequestBody);
                break;
            case MESSAGE_TOPIC.COMMAND:
                bodyInstance = new CommandRequestBody(body as ICommandRequestBody);
                break;
        }

        return new WebSocketRequest(topic, id, bodyInstance);
    }

    public toJSON(): string {
        const object = {
            topic: this.topic,
            body: this.body,
            id: this.id,
        };

        return JSON.stringify(object);
    }
}
