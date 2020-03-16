import { Event } from './event.model';
import { IBoard } from '../../board/interface';

export class BoardConnectedEvent extends Event {
    board: IBoard;
    newBoard: boolean;

    constructor(board: IBoard, newBoard: boolean) {
        super();

        this.board = board;
        this.newBoard = newBoard;
    }
}
