import * as FirmataBoard from 'firmata';
import { Socket } from 'net';

export default class FirmataBoardMock {
    constructor(socket?: Socket) {
        this.transport = socket;
    }

    transport: Socket;

    firmware = {
        name: 'bacon_eggs.ino',
    };
    samplingInterval: number;
    emit = jest.fn();
    removeListener = jest.fn();
    removeAllListeners = jest.fn();
    setSamplingInterval = jest.fn((interval: number) => (this.samplingInterval = interval));
    getSamplingInterval = jest.fn(() => this.samplingInterval);
    pins: FirmataBoard.Pins[] = [
        {
            analogChannel: 0,
            supportedModes: [FirmataBoard.PIN_MODE.ANALOG],
            value: 512,
            mode: FirmataBoard.PIN_MODE.ANALOG,
            report: FirmataBoard.REPORTING.ON,
            state: FirmataBoard.PIN_STATE.LOW,
        },
        {
            analogChannel: 127,
            supportedModes: [FirmataBoard.PIN_MODE.INPUT],
            value: 0,
            mode: FirmataBoard.PIN_MODE.INPUT,
            report: FirmataBoard.REPORTING.ON,
            state: FirmataBoard.PIN_STATE.LOW,
        },
    ];
    analogPins = [0];
    queryFirmware = jest.fn(callback => setTimeout(callback, 500));
    serialWrite = jest.fn();
    analogWrite = jest.fn();
    digitalRead = jest.fn();
    analogRead = jest.fn();
    digitalWrite = jest.fn();
    SERIAL_PORT_IDs = {
        HW_SERIAL0: 0x00,
        HW_SERIAL1: 0x00,
        HW_SERIAL2: 0x00,
        HW_SERIAL3: 0x00,
        SW_SERIAL0: 0x08,
        SW_SERIAL1: 0x08,
        SW_SERIAL2: 0x08,
        SW_SERIAL3: 0x08,
        DEFAULT: 0x08,
    };
    serialConfig = jest.fn();
}
