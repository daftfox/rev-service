import IPin from "./pin";

export default interface IBoard {
    id: string;
    name: string;
    type: string;
    currentProgram: string;
    online: boolean;
    lastUpdateReceived: string;
    availableCommands?: string[];
    vendorId?: string;
    productId?: string;
    pins?: IPin[];
}
