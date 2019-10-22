import * as FirmataBoard from 'firmata';

export default class FirmataBoardMock {
    samplingInterval: number;

    emit = jest.fn();
    removeListener = jest.fn();
    removeAllListeners = jest.fn();
    setSamplingInterval = jest.fn((interval: number) => this.samplingInterval = interval);
    getSamplingInterval = jest.fn(() => this.samplingInterval);
    pins = [
        {
            analogChannel: 0,
            supportedModes: [
                FirmataBoard.PIN_MODE.ANALOG
            ],
        }, {
            analogChannel: 127,
            supportedModes: [
                FirmataBoard.PIN_MODE.INPUT
            ],
        }
    ];
    analogPins = [
        {
            analogChannel: 0,
            supportedModes: [
                FirmataBoard.PIN_MODE.ANALOG
            ],
        }
    ];
    queryFirmware = jest.fn();
    serialWrite = jest.fn();
    analogWrite = jest.fn();
    digitalRead = jest.fn();
    digitalWrite = jest.fn();
}