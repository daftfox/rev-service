import { Message } from './message';
import { MESSAGE_TOPIC } from '../enum';
import * as uuid from 'uuid';
import { BoardRequestBody, ProgramRequestBody, CommandRequestBody } from '../body';
import { IBoardRequestBody, ICommandRequestBody, IProgramRequestBody } from '../interface';

export class Request extends Message {
    public id: string;

    constructor(topic: MESSAGE_TOPIC, id?: string, body?: BoardRequestBody | ProgramRequestBody | CommandRequestBody) {
        super(topic, body);

        this.id = id || uuid.v4();
    }

    public static fromJSON(json: string): Request {
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

        return new Request(topic, id, bodyInstance);
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
