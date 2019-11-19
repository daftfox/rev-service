import IPin from './pin';
import BoardArchitecture from '../board-architecture';

export default interface IBoard {
    id: string;
    name: string;
    type: string;
    currentProgram: string;
    online: boolean;
    lastUpdateReceived: string;
    architecture: BoardArchitecture;
    availableCommands?: string[];
    refreshRate?: number;
    vendorId?: string;
    productId?: string;
    pins?: IPin[];
}
