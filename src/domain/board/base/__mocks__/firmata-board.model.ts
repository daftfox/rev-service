import { Evt } from 'ts-evt';
import { IBoardDataValues } from '../../interface/board-data-values.interface';
import { IBoard } from '../../interface';
import { Socket } from 'net';
import * as fb from 'firmata';
import { dataValuesMock, discreteBoardMock } from './board.model';
import {
    BoardDisconnectedEvent,
    BoardReadyEvent,
    BoardUpdatedEvent,
    Event,
    FirmwareUpdatedEvent,
} from '../../../event/base';
import { BoardErrorEvent } from '../../../event/base/board-error.model';
jest.mock('net');
jest.mock('firmata');

export const errorMock = new Error('oops, something went wrong');

export class FirmataBoard extends fb {
    constructor(port: Socket | string) {
        super(port);

        this.mockTimer = setInterval(this.mockCalls);
    }
    static postFirmwareUpdate = false;
    static postReady = false;
    static postError = false;
    static postUpdate = false;
    static postDisconnect = false;

    public event = new Evt<Event>();

    private mockTimer: number;

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
        await this.event.postOnceMatched(new FirmwareUpdatedEvent(dataValuesMock));
        FirmataBoard.postFirmwareUpdate = false;
    }

    public async postReady(): Promise<void> {
        await this.event.postOnceMatched(new BoardReadyEvent());
        FirmataBoard.postReady = false;
    }

    public async postError(): Promise<void> {
        await this.event.postOnceMatched(new BoardErrorEvent(errorMock));
        FirmataBoard.postError = false;
    }

    public async postUpdate(): Promise<void> {
        await this.event.postOnceMatched(new BoardUpdatedEvent(discreteBoardMock));
        FirmataBoard.postUpdate = false;
    }

    public async postDisconnect(): Promise<void> {
        await this.event.postOnceMatched(new BoardDisconnectedEvent());
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
