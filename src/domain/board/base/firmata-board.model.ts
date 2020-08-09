import * as fb from 'firmata';
import { Socket } from 'net';
import { Evt } from 'ts-evt';
import { AVAILABLE_EXTENSIONS_KEYS, isAvailableExtension } from '../extension';
import { BoardDisconnectedEvent, BoardReadyEvent, Event, FirmwareUpdatedEvent, BoardErrorEvent } from '../../event';
import {LoggerService} from "../../../service/logger.service";

export { SERIAL_PORT_ID, PIN_MODE, PIN_STATE, Pins } from 'firmata';

export class FirmataBoard extends fb {
    public event = new Evt<Event>();

    constructor(port: Socket | string) {
        super(port);

        this.on('queryfirmware', () => {
            this.event.post(new FirmwareUpdatedEvent({ id: this.parseId(), type: this.parseType() }));
        });

        this.on('ready', () => {
            this.event.post(new BoardReadyEvent());
        });

        this.on('error', (error: Error) => {
            this.event.post(new BoardErrorEvent(error));
        });

        this.on('disconnect', () => {
            this.event.post(new BoardDisconnectedEvent());
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
            type = AVAILABLE_EXTENSIONS_KEYS.Board;
        }

        return type;
    }
}
