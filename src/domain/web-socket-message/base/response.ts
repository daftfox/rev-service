import { Message } from './message';
import { MESSAGE_TOPIC } from '../enum';
import { BoardResponseBody, ProgramResponseBody, ErrorResponseBody } from '../body';
import { getStatusText } from 'http-status-codes';

export class Response extends Message {
    public requestId: string;
    public status: number;
    public statusMessage: string;

    constructor(topic: MESSAGE_TOPIC, requestId: string, status: number, body?: any) {
        super(topic, body);

        this.status = status;
        this.statusMessage = getStatusText(status);
        this.requestId = requestId;
    }

    public static fromJSON(json: string): Response {
        const { topic, body, code, requestId } = JSON.parse(json);
        let bodyInstance: any;

        if (code < 400 && code >= 200) {
            switch (topic) {
                case MESSAGE_TOPIC.BOARD:
                    bodyInstance = new BoardResponseBody(body);
                    break;
                case MESSAGE_TOPIC.PROGRAM:
                    bodyInstance = new ProgramResponseBody(body);
                    break;
            }
        } else {
            bodyInstance = new ErrorResponseBody(body);
        }

        return new Response(topic, requestId, code, bodyInstance);
    }

    public toJSON(): string {
        const object = {
            topic: this.topic,
            body: this.body,
            requestId: this.requestId,
            code: this.status,
        };

        return JSON.stringify(object);
    }
}
