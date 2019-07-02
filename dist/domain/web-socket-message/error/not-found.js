"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web_socket_error_1 = require("./web-socket-error");
class NotFound extends web_socket_error_1.default {
    constructor(message) {
        super(message);
        this.code = 404;
        this.responseBody.error = `The requested resource could not be found.`;
    }
}
exports.default = NotFound;
//# sourceMappingURL=not-found.js.map