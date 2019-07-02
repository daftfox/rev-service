"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web_socket_error_1 = require("./web-socket-error");
class Conflict extends web_socket_error_1.default {
    constructor(message) {
        super(message);
        this.code = 409;
        this.responseBody.error = `The request could not be completed due to a conflict.`;
    }
}
exports.default = Conflict;
//# sourceMappingURL=conflict.js.map