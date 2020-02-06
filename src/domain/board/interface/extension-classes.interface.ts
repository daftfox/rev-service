import { Board } from '../base';

export interface IExtensionClasses {
    [key: string]: new (...args: any[]) => Board;
}
