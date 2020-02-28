import * as fb from 'firmata';
import { Socket } from 'net';
import { Evt } from 'ts-evt';
import { IBoard } from '../interface';
import { IBoardDataValues } from '../interface/board-data-values.interface';
import { AVAILABLE_EXTENSIONS_KEYS, isAvailableExtension } from '../extension';

export { SERIAL_PORT_ID, PIN_MODE, PIN_STATE, Pins } from 'firmata';

export class FirmataBoard extends fb {
    public firmwareUpdated = new Evt<IBoardDataValues>();
    public ready = new Evt<void>();
    public error = new Evt<Error>();
    public update = new Evt<IBoard>();
    public disconnect = new Evt<void>();

    constructor(port: Socket | string) {
        super(port);

        this.on('queryfirmware', () => {
            this.firmwareUpdated.post({ id: this.parseId(), type: this.parseType() });
        });

        this.on('ready', () => {
            this.ready.post();
        });

        this.on('error', (error: Error) => {
            this.error.post(error);
        });

        this.on('disconnect', () => {
            this.disconnect.post();
        });
    }

    public parseId(): string {
        return this.firmware.name
            .split('_')
            .pop()
            .replace('.ino', '');
    }

    public parseType(): string {
        let type = this.firmware.name.split('_').shift();

        if (!type || type.indexOf('.') >= 0 || !isAvailableExtension(type)) {
            type = AVAILABLE_EXTENSIONS_KEYS.BOARD;
        }

        return type;
    }
}
