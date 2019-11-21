import { BOARD_REQUEST_ACTION } from '../enum/board-request-action.enum';
import IBoard from './board';

export default interface IBoardRequestBody {
    action: BOARD_REQUEST_ACTION;
    boardId: string;
    board: IBoard;
}
