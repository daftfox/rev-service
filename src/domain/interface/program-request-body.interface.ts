import IProgram from './program';
import { PROGRAM_REQUEST_ACTION } from '../enum/program-request-action.enum';

export default interface IProgramRequestBody {
    action: PROGRAM_REQUEST_ACTION;
    program?: IProgram;
    programId?: string;
    boardId?: string;
    repeat?: number;
}
