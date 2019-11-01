import IBoard from "../../interface/board";

interface IBoardBroadcast {
    action: BOARD_BROADCAST_ACTION;
    boards: IBoard[];
}

export default IBoardBroadcast;

export enum BOARD_BROADCAST_ACTION {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
    REMOVE = 'REMOVE',
    REPLACE = 'REPLACE',
}
