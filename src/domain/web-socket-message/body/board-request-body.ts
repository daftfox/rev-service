import { IBoard } from '../../board';
import { BOARD_REQUEST_ACTION } from '../enum';
import { IBoardRequestBody } from '../interface';

export class BoardRequestBody implements IBoardRequestBody {
    action: BOARD_REQUEST_ACTION;
    boardId: string;
    board: IBoard;

    constructor(values: IBoardRequestBody) {
        Object.assign(this, values);
    }
}
