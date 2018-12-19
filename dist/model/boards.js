"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const board_1 = require("../domain/board");
const operators_1 = require("rxjs/operators");
const Subject_1 = require("rxjs/internal/Subject");
class Boards extends events_1.EventEmitter {
    constructor() {
        super();
        this.boards$ = new Subject_1.Subject();
        this.boardDisconnected$ = new Subject_1.Subject();
    }
    get boards() {
        return this.boards$.pipe(operators_1.filter(board => board !== null), operators_1.distinctUntilChanged(), operators_1.share());
    }
    get getAllBoards() {
        return this.boards.pipe(operators_1.scan((acc, cur) => [...acc, cur], []), operators_1.map(boards => boards.filter(board => board.status !== board_1.BoardStatus.DISCONNECTED)));
    }
    getBoardById(id) {
        return this.boards.pipe(operators_1.filter(board => board !== null), operators_1.scan((acc, cur) => [...acc, cur], []), operators_1.map(boards => boards.find(board => board.id === id)));
    }
    get boardDisconnected() {
        return this.boardDisconnected$.asObservable();
    }
    addBoard(board) {
        this.boards$.next(board);
    }
    removeBoard(board) {
        this.boardDisconnected$.next(board);
    }
}
exports.default = Boards;
//# sourceMappingURL=boards.js.map