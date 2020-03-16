import { BOARD_REQUEST_ACTION } from '../enum';
import { ICommandRequestBody } from '../interface';

export class CommandRequestBody implements ICommandRequestBody {
    boardId: string;
    action: BOARD_REQUEST_ACTION;
    parameters: string[];

    constructor(values: ICommandRequestBody) {
        Object.assign(this, values);
    }
}
