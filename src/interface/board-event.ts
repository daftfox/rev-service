import IBoard from "./board";

export default interface IBoardEvent {
    action: BoardActionType;
    data: IBoard[];
}

export enum BoardActionType {
    ADD,
    REMOVE,
    UPDATE,
    UPDATE_ALL
}