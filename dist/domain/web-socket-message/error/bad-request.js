"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web_socket_error_1 = require("./web-socket-error");
class BadRequest extends web_socket_error_1.default {
    constructor(message) {
        super(message);
        this.code = 400;
        this.responseBody.error = `The client sent a malformed message which could not get processed.`;
    }
}
exports.default = BadRequest;
//# sourceMappingURL=bad-request.js.map