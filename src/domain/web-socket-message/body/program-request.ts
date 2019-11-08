import IProgram from '../../interface/program';

interface IProgramRequest {
    action: ProgramAction;
    program?: IProgram;
    programId?: string;
    boardId?: string;
    repeat?: number; // how many times to run the provided program. Provide -1 to run the program indefinitely. ( default = 1 )
}

export default IProgramRequest;

export enum ProgramAction {
    CREATE = 'create',
    REQUEST = 'request',
    UPDATE = 'update',
    DELETE = 'delete',
    EXECUTE = 'execute',
    STOP = 'stop',
}
