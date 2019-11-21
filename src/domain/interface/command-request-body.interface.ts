export default interface ICommandRequestBody {
    boardId: string;
    action: string;
    parameters?: string[];
}
