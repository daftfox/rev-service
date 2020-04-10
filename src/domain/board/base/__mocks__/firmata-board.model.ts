import { Evt } from 'evt';
import { Socket } from 'net';
import * as fb from 'firmata';
import { dataValuesMock, discreteBoardMock } from './board.model';
import {
    BoardDisconnectedEvent,
    BoardReadyEvent,
    BoardUpdatedEvent,
    BoardErrorEvent,
    Event,
    FirmwareUpdatedEvent,
} from '../../../event/base';
import Timeout = NodeJS.Timeout;
jest.mock('net');
jest.mock('firmata');

export const errorMock = new Error('oops, something went wrong');

export class FirmataBoard extends fb {
    constructor(port: Socket | string) {
        super(port);

        this.mockTimer = setInterval(this.mockCalls, 100);
    }
    static postFirmwareUpdate = false;
    static postReady = false;
    static postError = false;
    static postUpdate = false;
    static postDisconnect = false;

    public event = new Evt<Event>();

    private mockTimer: Timeout;

    public static resetMocks(): void {
        FirmataBoard.postError = false;
        FirmataBoard.postDisconnect = false;
        FirmataBoard.postUpdate = false;
        FirmataBoard.postFirmwareUpdate = false;
        FirmataBoard.postReady = false;
    }

    private mockCalls = (): void => {
        if (FirmataBoard.postUpdate) this.postUpdate();
        else if (FirmataBoard.postError) this.postError();
        else if (FirmataBoard.postDisconnect) this.postDisconnect();
        else if (FirmataBoard.postFirmwareUpdate) this.postFirmwareUpdate();
        else if (FirmataBoard.postReady) this.postReady();
    };

    public disableMockTimer(): void {
        clearInterval(this.mockTimer);
    }

    public parseId(): string {
        return dataValuesMock.id;
    }

    public parseType(): string {
        return dataValuesMock.type;
    }

    public async postFirmwareUpdate(): Promise<void> {
        await this.event.postAsyncOnceHandled(new FirmwareUpdatedEvent(dataValuesMock));
        FirmataBoard.postFirmwareUpdate = false;
    }

    public async postReady(): Promise<void> {
        await this.event.postAsyncOnceHandled(new BoardReadyEvent());
        FirmataBoard.postReady = false;
    }

    public async postError(): Promise<void> {
        await this.event.postAsyncOnceHandled(new BoardErrorEvent(errorMock));
        FirmataBoard.postError = false;
    }

    public async postUpdate(): Promise<void> {
        await this.event.postAsyncOnceHandled(new BoardUpdatedEvent(discreteBoardMock));
        FirmataBoard.postUpdate = false;
    }

    public async postDisconnect(): Promise<void> {
        await this.event.postAsyncOnceHandled(new BoardDisconnectedEvent());
        FirmataBoard.postDisconnect = false;
    }
}

export const firmataBoardMockFactory = () => {
    const socketMock = new Socket();
    const mock = new FirmataBoard(socketMock);
    mock.pins = [
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

    mock.analogPins = [0];
    mock.SERIAL_PORT_IDs = {
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

    return mock;
};
