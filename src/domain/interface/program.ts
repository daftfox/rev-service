import ICommand from './command';

export default interface IProgram {
    name: string;
    deviceType: string;
    id?: string;
    commands?: ICommand[];
}
