import IProgram from '../../interface/program';
import IProgramRequestBody from '../../interface/program-request-body.interface';
import { PROGRAM_REQUEST_ACTION } from '../../enum/program-request-action.enum';

export default class ProgramRequestBody {
    action: PROGRAM_REQUEST_ACTION;
    program: IProgram;
    programId: string;
    boardId: string;
    repeat: number; // how many times to run the provided program. Provide -1 to run the program indefinitely. ( default = 1 )

    constructor(values: IProgramRequestBody) {
        Object.assign(this, values);
    }
}
