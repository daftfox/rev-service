import { BROADCAST_ACTION } from '../enum';
import { IBoard } from '../../board';
import { IProgram } from '../../program/interface';

export interface IBroadcastBody {
    action: BROADCAST_ACTION;
    payload: IBoard[] | IProgram[];
}
