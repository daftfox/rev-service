"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../service/logger");
const uuid = require("uuid");
/**
 * @classdesc A class used to instantiate WebSocket messages
 */
class WebSocketMessage {
    constructor(kind, type, body, reqId, code, id) {
        this.type = type;
        this.kind = kind;
        if (kind === WebSocketMessageKind.RESPONSE) {
            this.reqId = reqId;
            this.code = code;
        }
        else {
            this.id = id || uuid.v4();
        }
        if (body) {
            this.body = body;
        }
    }
    toJSON() {
        let webSocketMessage = {
            kind: this.kind,
            body: this.body,
            type: this.type,
        };
        if (this.kind === WebSocketMessageKind.RESPONSE) {
            Object.assign(webSocketMessage, {
                reqId: this.reqId,
                code: this.code,
            });
        }
        else {
            Object.assign(webSocketMessage, {
                id: this.id,
            });
        }
        return JSON.stringify(webSocketMessage);
    }
    static fromJSON(jsonMessage) {
        const { kind, body, id, reqId, code, type } = JSON.parse(jsonMessage);
        let webSocketMessage;
        // todo: decide whether or not to include responses / broadcasts in the switch.
        switch (type) {
            // case WebSocketMessageType.BOARD_BROADCAST:
            //     webSocketMessage = new this<BoardBroadcast>( kind, type, body, reqId, code, id );
            //     break;
            case WebSocketMessageType.BOARD_REQUEST:
                webSocketMessage = new this(kind, type, body, reqId, code, id);
                break;
            // case WebSocketMessageType.BOARD_RESPONSE:
            //     webSocketMessage = new this<BoardResponse>( kind, type, body, reqId, code, id );
            //     break;
            case WebSocketMessageType.COMMAND_REQUEST:
                webSocketMessage = new this(kind, type, body, reqId, code, id);
                break;
            case WebSocketMessageType.PROGRAM_REQUEST:
                webSocketMessage = new this(kind, type, body, reqId, code, id);
                break;
            // case WebSocketMessageType.PROGRAM_RESPONSE:
            //     webSocketMessage = new this<ProgramResponse>( kind, type, body, reqId, code, id );
            //     break;
            // case WebSocketMessageType.ERROR_RESPONSE:
            //     webSocketMessage = new this<ErrorResponse>( kind, type, body, reqId, code, id );
            //     break;
            // case WebSocketMessageType.EMPTY_RESPONSE:
            //     webSocketMessage = new this<null>( kind, type, null, reqId, code, id );
            //     break;
            default:
                WebSocketMessage.log.error(new Error(`Unknown type.`));
                break;
        }
        return webSocketMessage;
    }
}
WebSocketMessage.namespace = `WebSocketMessage`;
WebSocketMessage.log = new logger_1.default(WebSocketMessage.namespace);
var WebSocketMessageKind;
(function (WebSocketMessageKind) {
    WebSocketMessageKind["REQUEST"] = "req";
    WebSocketMessageKind["RESPONSE"] = "res";
    WebSocketMessageKind["BROADCAST"] = "brc";
})(WebSocketMessageKind = exports.WebSocketMessageKind || (exports.WebSocketMessageKind = {}));
var WebSocketMessageType;
(function (WebSocketMessageType) {
    WebSocketMessageType["BOARD_BROADCAST"] = "BoardBroadcast";
    WebSocketMessageType["BOARD_REQUEST"] = "BoardRequest";
    WebSocketMessageType["BOARD_RESPONSE"] = "BoardResponse";
    WebSocketMessageType["COMMAND_REQUEST"] = "CommandRequest";
    WebSocketMessageType["PROGRAM_REQUEST"] = "ProgramRequest";
    WebSocketMessageType["PROGRAM_RESPONSE"] = "ProgramResponse";
    WebSocketMessageType["EMPTY_RESPONSE"] = "EmptyResponse";
    WebSocketMessageType["ERROR_RESPONSE"] = "ErrorResponse";
})(WebSocketMessageType = exports.WebSocketMessageType || (exports.WebSocketMessageType = {}));
exports.default = WebSocketMessage;
//# sourceMappingURL=web-socket-message.js.map