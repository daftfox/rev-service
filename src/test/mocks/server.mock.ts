import {Server, Socket} from "net";

export default class ServerMock {
    server: Server;

    constructor() {
        this.server = new Server( this.connectionRequest ).listen(1337);
    }

    connectionRequest = ( socket: Socket ) => {
        const client = new Socket();
    }
}