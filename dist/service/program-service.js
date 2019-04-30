"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_service_1 = require("./command-service");
class ProgramService {
    static executeProgram(board, commands) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let command of commands) {
                yield command_service_1.default.executeCommand(board, command);
            }
            return Promise.resolve();
        });
    }
}
exports.default = ProgramService;
//# sourceMappingURL=program-service.js.map