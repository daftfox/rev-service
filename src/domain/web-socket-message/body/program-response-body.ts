import { IProgram } from '../../program';
import { IProgramResponseBody } from '../interface';

export class ProgramResponseBody implements IProgramResponseBody {
    programs: IProgram[];
    programId: string;

    constructor(values: IProgramResponseBody) {
        Object.assign(this, values);
    }
}
