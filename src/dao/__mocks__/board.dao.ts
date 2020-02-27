import {boardMock} from "../../domain/board/base/__mocks__/board.model";

export class BoardDAO {
    static create = jest.fn(() => Promise.resolve(boardMock));
    static persist = jest.fn(() => Promise.resolve(boardMock));
    static exists = jest.fn(() => Promise.resolve(false));
    static getAll = jest.fn(() => Promise.resolve([boardMock]));
    static destroy = jest.fn(() => Promise.resolve());
    static instantiateNewBoard = jest.fn(() => boardMock);
    static createBoardInstance = jest.fn(() => boardMock);
}