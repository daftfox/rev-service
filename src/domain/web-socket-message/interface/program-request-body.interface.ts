import { PROGRAM_REQUEST_ACTION } from '../enum';
import { IProgram } from '../../program/interface';

export interface IProgramRequestBody {
    action: PROGRAM_REQUEST_ACTION;
    program?: IProgram;
    programId?: string;
    boardId?: string;
    repeat?: number;
}
