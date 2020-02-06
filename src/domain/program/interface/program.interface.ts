import { ICommand } from './command.interface';

export interface IProgram {
    name: string;
    deviceType: string;
    id?: string;
    commands?: ICommand[];
}
