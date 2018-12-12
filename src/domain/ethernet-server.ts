import * as EtherPort from 'etherport';
import Board from 'firmata';
import BoardServer from "./board-server";

class EthernetServer extends BoardServer {
    etherPort: EtherPort;

    constructor(port, connectedCallback, namespace) {
        super(port, connectedCallback, namespace);

        this.listen();
    }

    listen() {
        this.debugLogger(`Ground control to Major Tom.`);
        this.etherPort = new EtherPort(this.port);
        this.etherPort.on('open', this.initializeBoard.bind(this));
    }

    initializeBoard() {
        this.state = BoardServer.CONNECTING;
        this.debugLogger(`Can you hear me Major Tom?`);
        this.board = new Board(this.etherPort, this.boardReadyCallback.bind(this));
    }

    // todo: fix
    handleDisconnect() {
        //this.debugLogger(`oh noes`);
        //this.emit('closed', this.port);
    }
}

export default EthernetServer;