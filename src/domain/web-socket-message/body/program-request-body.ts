import { IProgramRequestBody } from '../interface';
import { PROGRAM_REQUEST_ACTION } from '../enum';
import { IProgram } from '../../program/interface';

export class ProgramRequestBody implements IProgramRequestBody {
    action: PROGRAM_REQUEST_ACTION;
    program: IProgram;
    programId: string;
    boardId: string;
    repeat: number; // how many times to run the provided program. Provide -1 to run the program indefinitely. ( default = 1 )

    constructor(values: IProgramRequestBody) {
        Object.assign(this, values);
    }
}
