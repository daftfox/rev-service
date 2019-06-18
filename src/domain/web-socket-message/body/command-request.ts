interface CommandRequest {
    boardId: string;
    action: string;
    parameters?: string[];
}

export default CommandRequest;