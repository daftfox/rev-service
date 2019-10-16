import IPin from "./pin";
import IPinMapping from "./pin-mapping";

export default interface IBoard {
    id: string;
    name: string;
    type: string;
    currentProgram: string;
    online: boolean;
    lastUpdateReceived: string;
    pinMapping: IPinMapping;
    serialConnection: boolean;
    availableCommands?: string[];
    refreshRate?: number;
    vendorId?: string;
    productId?: string;
    pins?: IPin[];
}
