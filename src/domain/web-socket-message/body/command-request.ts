interface ICommandRequest {
    boardId: string;
    action: string;
    parameters?: string[];
}

export default ICommandRequest;