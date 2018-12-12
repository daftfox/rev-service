"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SocketMessage {
    constructor(payload, sender, recipient) {
        this.sender = sender;
        this.recipient = recipient;
        this.payload = payload;
    }
}
exports.default = SocketMessage;
//# sourceMappingURL=socket-message.js.map