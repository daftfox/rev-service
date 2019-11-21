import { BROADCAST_ACTION } from '../enum/broadcast-action.enum';
import IBoard from './board';
import IProgram from './program';

export default interface IBroadcastBody {
    action: BROADCAST_ACTION;
    payload: IBoard[] | IProgram[];
}
