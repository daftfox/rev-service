"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class Boards extends events_1.EventEmitter {
    constructor() {
        super();
        this.boards = [];
    }
    boardConnected(port, board) {
        this.boards[port] = board;
        this.emit('board-connected', port);
    }
    boardDisconnected(port) {
        this.boards.splice(port, 1);
        this.emit('board-disconnected', port);
    }
    runProgramOnBoard(board, program) {
        // todo: run program on board and set status to busy
    }
}
exports.boards = new Boards();
//# sourceMappingURL=boards.js.map