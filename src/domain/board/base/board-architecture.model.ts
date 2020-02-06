import { IPinMap } from '../interface';

export class BoardArchitecture {
    readonly name: string;
    readonly pinMap: IPinMap;

    constructor(name: string, pinMap: IPinMap) {
        this.name = name;
        this.pinMap = pinMap;
    }

    static isSupported(architecture: BoardArchitecture): boolean {
        const supportedBoards = Object.keys(SUPPORTED_ARCHITECTURES).map(key => SUPPORTED_ARCHITECTURES[key].name);
        return supportedBoards.indexOf(architecture.name) >= 0;
    }
}

export const SUPPORTED_ARCHITECTURES = {
    ARDUINO_UNO: new BoardArchitecture('Arduino UNO', { LED: 13, RX: 1, TX: 0 }),
    ESP_8266: new BoardArchitecture('ESP8266', { LED: 2, RX: 3, TX: 1 }),
};
