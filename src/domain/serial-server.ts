import { Board } from 'firmata';
import BoardServer from "./board-server";
import Timeout = NodeJS.Timeout;

export default class SerialServer extends BoardServer {
    poller: Timeout;

    constructor(port, connectedCallback, namespace) {
        super(port, connectedCallback, namespace);

        this.listen();
    }

    listen() {
        this.debugLogger(`Ground control to Major Tom.`);
        if (this.port) {
            this.connectToPort(this.port);
        } else {
            this.scanSerialPorts();
        }
    }

    // todo: refactor?
    scanSerialPorts(error?: any, port?: number) {
        if (error) {
            if(!this.poller) {
                // instantiate poller to check in ten seconds
                this.debugLogger(`No (compatible) devices found, checking again in ten seconds.`);
                this.poller = setInterval(() => {
                    this.scanSerialPorts();
                }, 10000);
            } else {
                // polling
                this.debugLogger(`Checking serial ports...`);
            }
        } else if (this.poller) {
            // no error, clear poller
            clearInterval(this.poller);
            this.poller = undefined;
            this.scanSerialPorts(undefined, port)
        } else if (port) {
            this.connectToPort(port);
        } else {
            Board.requestPort( this.scanSerialPorts.bind(this) );
        }
    }

    connectToPort( port ) {
        if ( typeof port === "object") {
            this.port = port.comName;
        } else {
            this.port = port;
        }
        this.state = BoardServer.CONNECTING;
        this.debugLogger = BoardServer.getDebugger(this.namespace, this.port);
        this.debugLogger(`Can you hear me Major Tom?`);
        this.board = new Board( this.port, this.boardReadyCallback.bind( this ) );
    }

    handleDisconnect() {
        this.debugLogger(`oh noes`);
    }
}