import { IPin } from './pin.interface';
import { BoardArchitecture } from '../base';

export interface IBoard {
    id: string;
    name: string;
    type: string;
    currentProgram: string;
    online: boolean;
    lastUpdateReceived: string;
    architecture: BoardArchitecture;
    availableActions?: string[];
    refreshRate?: number;
    vendorId?: string;
    productId?: string;
    pins?: IPin[];
}
