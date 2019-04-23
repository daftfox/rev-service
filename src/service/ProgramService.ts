import Board from "../domain/board";
import CommandService from "./command-service";
import ICommand from "../interface/command";

class ProgramService {
    public static async executeProgram( board: Board, commands: ICommand[] ): Promise<void> {
        for ( let command of commands ) {
            await CommandService.executeCommand( board, command );
        }
        return Promise.resolve();
    }
}

export default ProgramService;