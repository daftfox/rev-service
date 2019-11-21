import IProgram from './program';
import { ProgramAction } from '../../../dist/domain/web-socket-message/body/program-request';

export default interface IProgramRequestBody {
    action: ProgramAction;
    program?: IProgram;
    programId?: string;
    boardId?: string;
    repeat?: number;
}
