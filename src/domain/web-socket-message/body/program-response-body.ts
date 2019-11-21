import IProgram from '../../interface/program';
import IProgramResponseBody from '../../interface/program-response-body.interface';

export default class ProgramResponseBody implements IProgramResponseBody {
    programs: IProgram[];
    programId: string;

    constructor(values: IProgramResponseBody) {
        Object.assign(this, values);
    }
}
