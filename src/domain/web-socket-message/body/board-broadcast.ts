import IBoard from "../../../interface/board";

interface BoardBroadcast {
    action: BOARD_BROADCAST_ACTION;
    boards: IBoard[];
}

export default BoardBroadcast;

export enum BOARD_BROADCAST_ACTION {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
    REMOVE = 'REMOVE',
    REPLACE = 'REPLACE',
}
