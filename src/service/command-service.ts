import Boards from "../model/boards";
import ICommandEvent from "../interface/command-event";

class CommandService {
    private model: Boards;

    constructor( model: Boards ) {
        this.model = model;
    }

    public executeCommand( command: ICommandEvent ) {
        const board = this.model.getBoardById( command.boardId );
        board.executeCommand( command.action, command.parameter );
    }
}

export default CommandService;