import Board from "../domain/board";
import ICommand from "../interface/command";

class CommandService {
    public static executeCommand( board: Board, command: ICommand ): Promise<void> {
        return new Promise( ( resolve ) => {
            board.executeAction( command.action, ...command.parameters );
            setTimeout( resolve, command.duration || 100 );
        } );
    }
}

export default CommandService;