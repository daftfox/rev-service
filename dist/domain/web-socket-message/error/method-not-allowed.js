"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web_socket_error_1 = require("./web-socket-error");
class MethodNotAllowed extends web_socket_error_1.default {
    constructor(message) {
        super(message);
        this.code = 405;
        this.responseBody.error = `The client has requested to perform an illegal action.`;
    }
}
exports.default = MethodNotAllowed;
//# sourceMappingURL=method-not-allowed.js.map