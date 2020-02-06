import * as FirmataBoard from 'firmata';

export interface IPin {
    pinNumber: number;
    mode: FirmataBoard.PIN_MODE;
    value: FirmataBoard.PIN_STATE | number;
    supportedModes: FirmataBoard.PIN_MODE[];
    analog: boolean;
    [prop: string]: any;
}
