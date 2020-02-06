import { IBoard } from '../../board';
import { IBoardResponseBody } from '../interface';

export class BoardResponseBody implements IBoardResponseBody {
    boards: IBoard[];

    constructor(values: IBoardResponseBody) {
        Object.assign(this, values);
    }
}
