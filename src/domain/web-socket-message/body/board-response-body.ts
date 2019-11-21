import IBoard from '../../interface/board';
import IBoardResponseBody from '../../interface/board-response-body.interface';

export default class BoardResponseBody implements IBoardResponseBody {
    boards: IBoard[];

    constructor(values: IBoardResponseBody) {
        Object.assign(this, values);
    }
}
