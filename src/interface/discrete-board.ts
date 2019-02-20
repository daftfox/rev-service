export interface DiscreteBoard {
    id:        string;
    vendorId:  string;
    productId: string;
    status:    BoardStatus;
    type:      string;
}

export enum BoardStatus {
    AVAILABLE,
    OCCUPIED,
    ERROR,
    DISCONNECTED
}