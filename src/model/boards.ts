import { EventEmitter } from 'events';
import Board from 'firmata';

class Boards extends EventEmitter {
    boards: Board[];

    constructor() {
        super();
        this.boards = [];
    }

    boardConnected(port: string, board: Board) {
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

export let boards = new Boards();