import { Evt } from 'ts-evt';
import { Event } from '../../domain/event/base';

export class BoardService {
    public event = new Evt<Event>();
    public getAllBoards = jest.fn();
    public addBoard = jest.fn();
    public disconnectBoard = jest.fn();
    public updateBoard = jest.fn();
}
