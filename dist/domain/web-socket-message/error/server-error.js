"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web_socket_error_1 = require("./web-socket-error");
class ServerError extends web_socket_error_1.default {
    constructor(message) {
        super(message);
        this.code = 500;
        this.responseBody.error = `The server has encountered an error and the requested action could not be completed.`;
    }
}
exports.default = ServerError;
//# sourceMappingURL=server-error.js.map