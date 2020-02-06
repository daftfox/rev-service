import { BOARD_REQUEST_ACTION } from '../enum';
import { IBoard } from '../../board';

export interface IBoardRequestBody {
    action: BOARD_REQUEST_ACTION;
    boardId: string;
    board: IBoard;
}
