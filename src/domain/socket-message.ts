class SocketMessage {
    id: number;
    sender: string;
    recipient: string;
    payload: any;

    constructor(payload: any, sender: string, recipient?: string) {
        this.sender = sender;
        this.recipient = recipient;
        this.payload = payload;
    }
}

export default SocketMessage;