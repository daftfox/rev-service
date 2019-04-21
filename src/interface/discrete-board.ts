export default interface DiscreteBoard {
    id:        string;
    vendorId:  string;
    productId: string;
    type:      string;
    currentJob?: string;
    commands?: string[];
}