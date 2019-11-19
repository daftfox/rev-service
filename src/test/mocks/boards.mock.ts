import * as events from 'events';
import Board from '../../domain/board';

export default class BoardsMock extends events.EventEmitter {
    addBoard = jest.fn(board => Promise.resolve(Board.toDiscrete(board)));
    disconnectBoard = jest.fn();
    updateBoard = jest.fn();
}
