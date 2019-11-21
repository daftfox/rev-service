import BoardsModel from '../../model/boards.model';
import ProgramsModel from '../../model/programs.model';

export default interface IWebSocketOptions {
    port: number;
    boardModel: BoardsModel;
    programModel: ProgramsModel;
}
