import { Socket } from 'net';
import {
    ANALOG_MAPPING_BYTE_ARRAY_BUFFER,
    CAPABILITIES_BYTE_ARRAY_BUFFER,
    HOST,
    TCP_PORT,
    VERSION_BYTE_ARRAY_BUFFER,
} from './constants';

export class BoardMock {
    socket: Socket;

    constructor(ethernet: boolean) {
        this.socket = new Socket();
        this.socket.connect({ host: HOST, port: TCP_PORT }, () => {
            this.socket.on('data', this.handleRequest);
        });
    }

    close() {
        this.socket.end();
        this.socket.destroy();
    }

    handleRequest = (data: Buffer): void => {
        if (data[0] === 0xf9) {
            this.sendQueryFirmwareReply();
        } else if (data[0] === 0xf0 && data[1] === 0x6b) {
            this.sendCapabilitiesReport();
        } else if (data[0] === 0xf0 && data[1] === 0x69) {
            this.sendAnalogMapping();
        }
    };

    sendQueryFirmwareReply(): void {
        this.socket.write(VERSION_BYTE_ARRAY_BUFFER);
    }

    sendCapabilitiesReport(): void {
        this.socket.write(CAPABILITIES_BYTE_ARRAY_BUFFER);
    }

    sendAnalogMapping(): void {
        this.socket.write(ANALOG_MAPPING_BYTE_ARRAY_BUFFER);
    }
}
