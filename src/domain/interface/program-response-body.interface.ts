import IProgram from './program';

export default interface IProgramResponseBody {
    programs?: IProgram[];
    programId?: string;
}
