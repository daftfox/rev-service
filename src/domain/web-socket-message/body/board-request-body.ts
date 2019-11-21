import IBoard from '../../interface/board';
import { BOARD_REQUEST_ACTION } from '../../enum/board-request-action.enum';
import IBoardRequestBody from '../../interface/board-request-body.interface';

export default class BoardRequestBody implements IBoardRequestBody {
    action: BOARD_REQUEST_ACTION;
    boardId: string;
    board: IBoard;

    constructor(values: IBoardRequestBody) {
        Object.assign(this, values);
    }
}
