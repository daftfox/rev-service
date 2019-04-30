export default interface ICommandEvent {
    boardId:   string;
    action:   string;
    parameters?: string[];
}