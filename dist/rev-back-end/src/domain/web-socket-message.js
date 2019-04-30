"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WebSocketMessage {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
    }
    toString() {
        return JSON.stringify({
            type: this.type,
            payload: this.payload
        });
    }
}
var WebSocketMessageType;
(function (WebSocketMessageType) {
    WebSocketMessageType[WebSocketMessageType["BOARD_EVENT"] = 0] = "BOARD_EVENT";
    WebSocketMessageType[WebSocketMessageType["COMMAND_EVENT"] = 1] = "COMMAND_EVENT";
    WebSocketMessageType[WebSocketMessageType["PROGRAM_EVENT"] = 2] = "PROGRAM_EVENT";
})(WebSocketMessageType = exports.WebSocketMessageType || (exports.WebSocketMessageType = {}));
exports.default = WebSocketMessage;
//# sourceMappingURL=web-socket-message.js.map