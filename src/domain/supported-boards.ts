import BoardArchitecture from "./board-architecture";

export class SupportedBoards {
    static readonly ARDUINO_UNO = new BoardArchitecture('Arduino UNO', {LED: 13, RX: 1, TX: 0});
    static readonly ESP_8266 = new BoardArchitecture('ESP8266', {LED: 2, RX: 3, TX: 1});

    static isSupported( architecture: BoardArchitecture ): boolean {
        const supportedBoards = Object.keys(SupportedBoards).map( key => SupportedBoards[key].name )
        return supportedBoards.indexOf( architecture.name ) >= 0;
    }
}