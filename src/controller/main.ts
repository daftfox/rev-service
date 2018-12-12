import { ethernetServers } from "../model/ethernet-servers";
import { serialServers } from "../model/serial-servers";
import Config from '../config/config';
import { ioService } from "../service/io";
import { boards } from "../model/boards";

class MainController {
    options: Config;

    constructor () {
        this.options = Config.options.parse(process.argv);

        this.startWebSocket();
        this.listenForBoardChanges();
        this.startServers();
    }

    startServers() {
        if ( this.options.ethernet ) {
            this.startEthernetServers();
        }
        if ( this.options.serial ) {
            this.startSerialServers();
        }
    }

    startWebSocket() {
        ioService.initializeSocketIO(this.options.port);
    }

    startEthernetServers() {
        ethernetServers.setPorts(this.options.startPort, this.options.endPort);
        ethernetServers.initializeServers();
    }

    startSerialServers() {
        serialServers.initializeServers();
    }

    listenForBoardChanges() {
        boards.on('board-connected',    this.handleBoardConnected);
        boards.on('board-disconnected', this.handleBoardDisconnected);
    }

    handleBoardConnected(port: string) {
        ioService.broadcastUpdate('board-connected', { id: port }, 'ground-control');
    }

    handleBoardDisconnected() {

    }
}

export default MainController;