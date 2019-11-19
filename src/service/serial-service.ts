import ConnectionService from './connection-service';
import Boards from '../model/boards';
import * as SerialPort from 'serialport';
import LoggerService from './logger-service';
import Chalk from 'chalk';
import Timeout = NodeJS.Timeout;
import Board from '../domain/board';

/**
 * @description Service that automatically connects to any Firmata compatible devices physically connected to the host.
 * @namespace SerialService
 */
class SerialService extends ConnectionService {
    /**
     * A list of port IDs in which an unsupported device is plugged in.
     * @access private
     * @type {string[]}
     */
    private unsupportedDevices: string[] = [];

    private usedPorts: string[] = [];

    private portScanInterval: Timeout;

    /**
     * @constructor
     * @param {Boards} model
     */
    constructor(model: Boards) {
        super(model);

        this.namespace = 'serial';
        this.log = new LoggerService(this.namespace);
    }

    public closeServer(): void {
        clearInterval(this.portScanInterval);
        this.portScanInterval = undefined;
    }

    /**
     * Scans the host's ports every 3 seconds.
     * @access private
     */
    public listen(): void {
        this.log.info(`Listening on serial ports.`);
        this.portScanInterval = setInterval(this.scanPorts, 10000);
    }

    private scanPorts = async (): Promise<void> => {
        const ports = await this.getAvailableSerialPorts();
        return this.attemptConnectionToPorts(ports);
    };

    /**
     * Scans serial ports and automatically connects to all compatible devices.
     */
    private getAvailableSerialPorts = (): Promise<SerialPort.PortInfo[]> => {
        // list all connected serial devices
        return SerialPort.list().then((ports: SerialPort.PortInfo[]) => {
            // filter out clearly incompatible devices
            return this.filterPorts(ports);
        });
    };

    private filterPorts = (ports: SerialPort.PortInfo[]): SerialPort.PortInfo[] => {
        return ports
            .filter(port => port.productId !== undefined)
            .filter(port => this.usedPorts.indexOf(port.comName) < 0)
            .filter(port => this.unsupportedDevices.indexOf(port.comName) < 0);
    };

    private attemptConnectionToPorts(ports: SerialPort.PortInfo[]): Promise<void> {
        return new Promise((resolve, reject) => {
            ports.forEach(port => {
                this.attemptConnectionToPort(port).then(() => {
                    this.usedPorts.push(port.comName);
                });
            });

            resolve();
        });
    }

    private attemptConnectionToPort = (port: SerialPort.PortInfo): Promise<void> => {
        return this.connectToBoard(port.comName)
            .then(this.handleConnected)
            .catch((board?: Board) => {
                this.handleDisconnected(port, board);
            });
    };

    private handleDisconnected = (port: SerialPort.PortInfo, board?: Board) => {
        this.usedPorts.splice(this.usedPorts.indexOf(port.comName), 1);
        if (!board) {
            this.unsupportedDevices.push(port.comName);
        }
    };

    private handleConnected = (board: Board) => {
        this.log.info(`Device ${Chalk.rgb(0, 143, 255).bold(board.id)} connected.`);
        board.setIsSerialConnection(true);
    };
}

export default SerialService;
