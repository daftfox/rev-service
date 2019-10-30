import IBoard from "../../interface/board";

interface BoardRequest {
    action: BoardAction;
    boardId: string;
    board: IBoard;
}

export default BoardRequest;

export enum BoardAction {
    REQUEST = 'request',
    UPDATE = 'update',
    DELETE = 'delete',
}