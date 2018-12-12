import Debugger from 'debug';
import Board from 'firmata';

export default class BoardServer {

    static DISCONNECTED = 0;
    static CONNECTING = 1;
    static CONNECTED = 2;

    port: number;
    namespace: string;
    connectedCallback: (...args) => {};
    state: number;
    debugLogger: Debugger;
    board: Board;

    constructor(port, connectedCallback, namespace) {
        this.port = port;
        this.namespace = namespace;
        this.connectedCallback = connectedCallback;
        this.state = BoardServer.DISCONNECTED;
        this.debugLogger = BoardServer.getDebugger(namespace, port);
    }

    // todo: move elsewhere
    static getDebugger(namespace, port) : Debugger {
        return Debugger.debug(`${namespace || 'server'}${port ? '@'+port : ''}`);
    }

    boardReadyCallback() {
        this.state = BoardServer.CONNECTED;
        this.board.debugLogger = BoardServer.getDebugger('major-tom', this.port);
        this.board.debugLogger(`This is Major Tom to ground control.`);

        // let batLvl = 0;
        //
        // this.board.pinMode(3, 3);

        // setInterval(() => {
        //     this.board.analogWrite(3, batLvl);
        //     batLvl += 10;
        //     if (batLvl >= 255) {
        //         batLvl = 0;
        //     }
        // }, 100);

        //this.board.on('ready', () => {
        //this.board.digitalWrite(16, true); // d5
        //this.board.analogWrite(0, 255); // d6
        //});

        //console.log(this.board.pins);
        //console.log(this.board.analogPins);
        //console.log(this.board.MODES);

        // this.board.analogWrite(14, 255);


        this.connectedCallback(this);
    }
}