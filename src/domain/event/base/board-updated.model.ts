import { Event } from './event.model';
import { IBoard } from '../../board/interface';

export class BoardUpdatedEvent extends Event {
    board: IBoard;

    constructor(board: IBoard) {
        super();

        this.board = board;
    }
}
