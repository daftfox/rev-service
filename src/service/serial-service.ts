import ConnectionService from './connection-service';
import Boards from '../model/boards';
import SerialPort, { PortConfig } from 'serialport';
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
        this.portScanInterval = setInterval(this.scanSerialPorts.bind(this), 10000);
    }

    /**
     * Scans serial ports and automatically connects to all compatible devices.
     * @access private
     */
    private scanSerialPorts(): void {
        SerialPort.list((error: any, ports: PortConfig[]) => {
            // list all connected serial devices

            const availablePort = ports
                .filter(port => port.productId !== undefined)
                .filter(port => this.usedPorts.indexOf(port.comName) < 0)
                .filter(port => this.unsupportedDevices.indexOf(port.comName) < 0)
                .pop();

            if (availablePort) {
                this.usedPorts.push(availablePort.comName);
                this.attemptConnection(availablePort);
            }
        });
    }

    private attemptConnection = (port: PortConfig): Promise<void> => {
        return this.connectToBoard(port.comName)
            .then((board: Board) => {
                this.log.info(`Device ${Chalk.rgb(0, 143, 255).bold(board.id)} connected.`);
                board.setIsSerialConnection(true);
            })
            .catch((board?: Board) => {
                this.usedPorts.splice(this.usedPorts.indexOf(port.comName), 1);
                if (board) {
                    this.log.info(`Device ${board.id} disconnected.`);

                    this.model.disconnectBoard(board.id);
                } else {
                    this.unsupportedDevices.push(port.comName);
                }
            });
    };
}

export default SerialService;
