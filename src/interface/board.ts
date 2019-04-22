export default interface IBoard {
    id:        string;
    vendorId:  string;
    productId: string;
    type:      string;
    currentJob?: string;
    commands?: string[];
}