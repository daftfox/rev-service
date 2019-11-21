import { BOARD_REQUEST_ACTION } from '../../enum/board-request-action.enum';
import ICommandRequestBody from '../../interface/command-request-body.interface';

export default class CommandRequestBody implements ICommandRequestBody {
    boardId: string;
    action: BOARD_REQUEST_ACTION;
    parameters: string[];

    constructor(values: ICommandRequestBody) {
        Object.assign(this, values);
    }
}
