import ICommand from './command.interface';

export default interface IProgram {
    name: string;
    deviceType: string;
    id?: string;
    commands?: ICommand[];
}
