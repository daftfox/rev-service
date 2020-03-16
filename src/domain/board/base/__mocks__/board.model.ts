import * as FirmataBoard from 'firmata';
import { SUPPORTED_ARCHITECTURES } from '../board-architecture.model';

export const idsMock = ['bacon', 'eggs'];
export const unknownDataValuesMock = {
    id: 'bacon',
    type: 'SuperBoard',
};
export const dataValuesMock = {
    id: 'bacon',
    type: 'Board',
};
export const discreteBoardMock = {
    id: 'bacon',
    name: 'eggs',
    type: 'Board',
    vendorId: undefined,
    productId: undefined,
    currentProgram: undefined,
    online: false,
    lastUpdateReceived: 'abcdef',
    architecture: SUPPORTED_ARCHITECTURES.ARDUINO_UNO,
    availableCommands: {},
};

export class Board {
    constructor(id) {
        this.id = id;
    }
    static findAll = jest.fn(() => Promise.resolve(allBoardsMock));
    static findByPk = jest.fn(() => Promise.resolve());
    static toDiscreteArray = jest.fn(() => [discreteBoardMock]);
    id = dataValuesMock.id;
    type = dataValuesMock.type;
    firmataBoard = undefined;
    online = false;
    currentProgram = 'IDLE';
    update = jest.fn();
    attachFirmataBoard = jest.fn((fb: FirmataBoard) => (this.firmataBoard = fb));
    getFirmataBoard = jest.fn(() => this.firmataBoard);
    toDiscrete = jest.fn(() => discreteBoardMock);
    save = jest.fn(() => Promise.resolve());
    destroy = jest.fn(() => Promise.resolve());
    clearAllTimers = jest.fn();
    disconnect = jest.fn();
    availableActions = {};
    executeAction = jest.fn();
    getDataValues = jest.fn(() => dataValuesMock);
}

export const boardMock = new Board(idsMock[0]);

export const allBoardsMock = [boardMock, new Board(idsMock[1])];
