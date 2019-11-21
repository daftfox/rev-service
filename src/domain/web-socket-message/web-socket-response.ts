import WebSocketMessage from './web-socket-message';
import { RESPONSE_CODE } from '../enum/response-code.enum';
import { MESSAGE_TOPIC } from '../enum/message-topic.enum';
import BoardResponseBody from './body/board-response-body';
import ProgramResponseBody from './body/program-response-body';
import ErrorResponseBody from './body/error-response-body';

export default class WebSocketResponse extends WebSocketMessage {
    public requestId: string;
    public code: RESPONSE_CODE;

    constructor(topic: MESSAGE_TOPIC, requestId: string, code: RESPONSE_CODE, body?: any) {
        super(topic, body);

        this.code = code;
        this.requestId = requestId;
    }

    public static fromJSON(json: string): WebSocketResponse {
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

        return new WebSocketResponse(topic, requestId, code, bodyInstance);
    }

    public toJSON(): string {
        const object = {
            topic: this.topic,
            body: this.body,
            requestId: this.requestId,
            code: this.code,
        };

        return JSON.stringify(object);
    }
}
