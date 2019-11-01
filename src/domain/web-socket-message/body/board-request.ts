import IBoard from "../../interface/board";

interface IBoardRequest {
    action: BoardAction;
    boardId: string;
    board: IBoard;
}

export default IBoardRequest;

export enum BoardAction {
    REQUEST = 'request',
    UPDATE = 'update',
    DELETE = 'delete',
}