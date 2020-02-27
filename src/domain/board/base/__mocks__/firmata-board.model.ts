import {Evt} from 'ts-evt';
import {IBoardDataValues} from '../../interface/board-data-values.interface';
import {IBoard} from '../../interface';
import {Socket} from 'net';
import * as fb from 'firmata';
import {dataValuesMock, discreteBoardMock} from "./board.model";

export const errorMock = new Error('oops, something went wrong');

export class FirmataBoard extends fb {
    static postFirmwareUpdate = false;
    static postReady = false;
    static postError = false;
    static postUpdate = false;
    static postDisconnect = false;

    public firmwareUpdated = new Evt<IBoardDataValues>();
    public ready = new Evt<void>();
    public error = new Evt<Error>();
    public update = new Evt<IBoard>();
    public disconnect = new Evt<void>();

    constructor(port: Socket | string) {
        super(port);

        setInterval(this.mockCalls);
    }

    private mockCalls = (): void => {
        if (FirmataBoard.postUpdate) this.postUpdate();
        else if (FirmataBoard.postError) this.postError();
        else if (FirmataBoard.postDisconnect) this.postDisconnect();
        else if (FirmataBoard.postFirmwareUpdate) this.postFirmwareUpdate();
        else if (FirmataBoard.postReady) this.postReady();
    };

    public parseId(): string {
        return dataValuesMock.id;
    }

    public parseType(): string {
        return dataValuesMock.type;
    }

    public static resetMocks(): void {
        FirmataBoard.postError = false;
        FirmataBoard.postDisconnect = false;
        FirmataBoard.postUpdate = false;
        FirmataBoard.postFirmwareUpdate = false;
        FirmataBoard.postReady = false;
    }

    public async postFirmwareUpdate(): Promise<void> {
        await this.firmwareUpdated.postOnceMatched(dataValuesMock);
        FirmataBoard.postFirmwareUpdate = false;
    }

    public async postReady(): Promise<void> {
        await this.ready.postOnceMatched();
        FirmataBoard.postReady = false;
    }

    public async postError(): Promise<void> {
        await this.error.postOnceMatched(errorMock);
        FirmataBoard.postError = false;
    }

    public async postUpdate(): Promise<void> {
        await this.update.postOnceMatched(discreteBoardMock);
        FirmataBoard.postUpdate = false;
    }

    public async postDisconnect(): Promise<void> {
        await this.disconnect.postOnceMatched();
        FirmataBoard.postDisconnect = false;
    }
}


const socketMock = new Socket();
export const firmataBoardMock = new FirmataBoard(socketMock);
firmataBoardMock.pins = [
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

firmataBoardMock.analogPins = [0];