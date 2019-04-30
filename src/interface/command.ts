export default interface ICommand {
    action: string;
    duration?: number;
    parameters?: string[];
}