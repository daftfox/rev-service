"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WebSocketError extends Error {
    constructor(message) {
        super(message);
        this.responseBody = {
            error: null,
            message: null,
        };
        this.responseBody.message = message;
    }
}
exports.default = WebSocketError;
//# sourceMappingURL=web-socket-error.js.map