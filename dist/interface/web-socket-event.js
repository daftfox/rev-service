"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WebSocketEvent {
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
var WebSocketEventType;
(function (WebSocketEventType) {
    WebSocketEventType[WebSocketEventType["ADD_BOARD"] = 0] = "ADD_BOARD";
    WebSocketEventType[WebSocketEventType["REMOVE_BOARD"] = 1] = "REMOVE_BOARD";
    WebSocketEventType[WebSocketEventType["UPDATE_ALL_BOARDS"] = 2] = "UPDATE_ALL_BOARDS";
    WebSocketEventType[WebSocketEventType["EXECUTE_PROGRAM"] = 3] = "EXECUTE_PROGRAM";
})(WebSocketEventType = exports.WebSocketEventType || (exports.WebSocketEventType = {}));
exports.default = WebSocketEvent;
//# sourceMappingURL=web-socket-event.js.map