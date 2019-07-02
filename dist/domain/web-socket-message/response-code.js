"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResponseCode;
(function (ResponseCode) {
    ResponseCode[ResponseCode["OK"] = 200] = "OK";
    ResponseCode[ResponseCode["CREATED"] = 201] = "CREATED";
    ResponseCode[ResponseCode["NO_CONTENT"] = 204] = "NO_CONTENT";
    ResponseCode[ResponseCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    ResponseCode[ResponseCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    ResponseCode[ResponseCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    ResponseCode[ResponseCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    ResponseCode[ResponseCode["METHOD_NOT_ALLOWED"] = 405] = "METHOD_NOT_ALLOWED";
    ResponseCode[ResponseCode["CONFLICT"] = 409] = "CONFLICT";
    ResponseCode[ResponseCode["SERVER_ERROR"] = 500] = "SERVER_ERROR";
})(ResponseCode = exports.ResponseCode || (exports.ResponseCode = {}));
//# sourceMappingURL=response-code.js.map