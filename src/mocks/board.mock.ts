import FirmataBoardMock from './firmata-board.mock';

export default class BoardMock {
    id: string;
    name: string;
    type: string;
    lastUpdateReceived = '2019-11-09 02:31:47';
    firmataBoard = new FirmataBoardMock();

    constructor(id: string, name: string, type: string) {
        this.id = id;
        this.type = type;
        this.name = name;
    }

    getFirmataBoard = () => {
        return undefined;
    };
}
