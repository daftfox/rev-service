import IProgram from "../../interface/program";

interface IProgramResponse {
    programs?: IProgram[];
    programId?: string;
}

export default IProgramResponse;