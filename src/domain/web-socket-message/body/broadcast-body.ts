import IBoard from '../../interface/board';
import IProgram from '../../interface/program';
import { BROADCAST_ACTION } from '../../enum/broadcast-action.enum';
import IBroadcastBody from '../../interface/broadcast-body.interface';

export default class BroadcastBody implements IBroadcastBody {
    action: BROADCAST_ACTION;
    payload: IBoard[] | IProgram[];

    constructor(values: IBroadcastBody) {
        this.action = values.action;
        this.payload = values.payload;
    }
}
