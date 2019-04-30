"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandService {
    static executeCommand(board, command) {
        return new Promise((resolve) => {
            board.executeAction(command.action, ...command.parameters);
            setTimeout(resolve, command.duration || 100);
        });
    }
}
exports.default = CommandService;
//# sourceMappingURL=command-service.js.map