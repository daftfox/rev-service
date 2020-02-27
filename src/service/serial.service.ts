import { ConnectionService } from './connection.service';
import * as SerialPort from 'serialport';
import { LoggerService } from './logger.service';
import Timeout = NodeJS.Timeout;
import { Board } from '../domain/board';
import { singleton } from 'tsyringe';

/**
 * @description Service that automatically connects to any Firmata compatible devices physically connected to the host.
 * @namespace SerialService
 */
@singleton()
export class SerialService extends ConnectionService {
    /**
     * A list of port IDs in which an unsupported device is plugged in.
     * @access private
     * @type {string[]}
     */
    private unsupportedDevices: string[] = [];

    private usedPorts: string[] = [];

    private portScanInterval: Timeout;

    protected namespace = 'serial-service';

    /**
     * @constructor
     */
    constructor() {
        super();
    }

    public listen(): void {
        LoggerService.info(`Listening on serial ports.`, this.namespace);
        this.portScanInterval = setInterval(this.scanPorts, 10000);
    }

    public closeServer(): void {
        clearInterval(this.portScanInterval);
        this.portScanInterval = undefined;
    }

    protected handleConnected = (board: Board): void => {
        LoggerService.info(`Device ${LoggerService.highlight(board.id, 'blue', true)} connected.`, this.namespace);
        board.setIsSerialConnection(true);
    };

    protected handleDisconnected = (port: SerialPort.PortInfo, board?: Board): void => {
        this.usedPorts.splice(this.usedPorts.indexOf(port.path), 1);
        if (!board) {
            this.unsupportedDevices.push(port.path);
        }
    };

    private scanPorts = async (): Promise<void> => {
        const ports = await this.getAvailableSerialPorts();
        return this.attemptConnectionToPorts(ports);
    };

    /**
     * Scans serial ports and automatically connects to all compatible devices.
     */
    private getAvailableSerialPorts = (): Promise<SerialPort.PortInfo[]> => {
        // list all connected serial devices
        return SerialPort.list()
            .then((ports: SerialPort.PortInfo[]) => {
                // filter out clearly incompatible devices
                return this.filterPorts(ports);
            })
            .catch(() => {
                // for devices that don't support serial/usb ports
                // such as VMs running in a CI/CD pipeline
                return [];
            });
    };

    private filterPorts = (ports: SerialPort.PortInfo[]): SerialPort.PortInfo[] => {
        return ports
            .filter(port => port.productId !== undefined)
            .filter(port => this.usedPorts.indexOf(port.path) < 0)
            .filter(port => this.unsupportedDevices.indexOf(port.path) < 0);
    };

    private attemptConnectionToPorts(ports: SerialPort.PortInfo[]): Promise<void> {
        return new Promise((resolve, reject) => {
            ports.forEach(port => {
                this.attemptConnectionToPort(port).then(() => {
                    this.usedPorts.push(port.path);
                });
            });

            resolve();
        });
    }

    private attemptConnectionToPort = (port: SerialPort.PortInfo): Promise<void> => {
        return this.connectToBoard(port.path)
            .then(this.handleConnected)
            .catch((board?: Board) => {
                this.handleDisconnected(port, board);
            });
    };
}
