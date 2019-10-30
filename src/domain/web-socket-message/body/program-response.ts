import IProgram from "../../interface/program";

interface ProgramResponse {
    programs?: IProgram[];
    programId?: string;
}

export default ProgramResponse;