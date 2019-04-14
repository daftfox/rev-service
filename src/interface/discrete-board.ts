export interface DiscreteBoard {
    id:        string;
    vendorId:  string;
    productId: string;
    status:    BoardStatus;
    type:      string;
}

export enum BoardStatus {
    READY,
    BUSY,
    ERROR,
    DISCONNECTED
}