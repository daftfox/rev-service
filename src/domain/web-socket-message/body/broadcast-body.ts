import { IBoard } from '../../board';
import { IProgram } from '../../program';
import { BROADCAST_ACTION } from '../enum';
import { IBroadcastBody } from '../interface';

export class BroadcastBody implements IBroadcastBody {
    action: BROADCAST_ACTION;
    payload: IBoard[] | IProgram[];

    constructor(values: IBroadcastBody) {
        this.action = values.action;
        this.payload = values.payload;
    }
}
