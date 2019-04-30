"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_service_1 = require("./command-service");
class ProgramService {
    static executeProgram(board, commands) {
        for (let command of commands) {
            command_service_1.default.executeCommand(board, command);
        }
    }
}
exports.default = ProgramService;
//# sourceMappingURL=ProgramService.js.map