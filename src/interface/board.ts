import IPin from "./pin";

export default interface IBoard {
    id: string;
    vendorId: string;
    productId: string;
    type: string;
    pins?: IPin[];
    currentJob?: string;
    commands?: string[];
}