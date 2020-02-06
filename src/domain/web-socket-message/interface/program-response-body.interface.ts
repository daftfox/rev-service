import { IProgram } from '../../program/interface';

export interface IProgramResponseBody {
    programs?: IProgram[];
    programId?: string;
}
