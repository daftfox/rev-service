import ICommand from "../interface/command";
import IBoard from "../interface/board";

class CommandService {
    // todo fix
    // public static executeCommand( board: IBoard, command: ICommand ): Promise<void> {
    //     return new Promise( ( resolve, reject ) => {
    //         try {
    //             board.executeAction( command.action, command.parameters );
    //             setTimeout( resolve, command.duration || 100 );
    //         } catch ( error ) {
    //             reject( error );
    //         }
    //     } );
    // }
}

export default CommandService;