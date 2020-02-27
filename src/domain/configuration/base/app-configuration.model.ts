import { IAppConfiguration } from '../interface';
import { IFlags } from '../interface/flags.interface';

export class AppConfiguration implements IAppConfiguration {
    serial: boolean;
    debug: boolean;
    ethernet: boolean;

    constructor({ serial, debug, ethernet }: IFlags) {
        this.serial = serial;
        this.debug = debug;
        this.ethernet = ethernet;
    }
}
