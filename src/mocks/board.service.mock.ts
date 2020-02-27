import * as events from 'events';

export const instantiateNewBoard = jest.fn();
export const findOrBuildBoard = jest.fn();
export const synchronise = jest.fn();
export const getAllBoards = jest.fn();
export const getDiscreteBoardById = jest.fn();
export const getBoardById = jest.fn();
export const addBoard = jest.fn();
export const deleteBoard = jest.fn();
export const disconnectBoard = jest.fn();
export const updateBoard = jest.fn();
export const executeActionOnBoard = jest.fn();
export const stopProgram = jest.fn();
export const executeProgramOnBoard = jest.fn();
export const on = jest.fn();

export class BoardServiceMock extends events.EventEmitter {
    constructor() {
        super();
    }
    public static instantiateNewBoard = instantiateNewBoard;
    private static findOrBuildBoard = findOrBuildBoard;

    private _boards: string[] = ['test'];
    public synchronise = synchronise;
    public getAllBoards = getAllBoards;
    public getDiscreteBoardById = getDiscreteBoardById;
    public getBoardById = getBoardById;
    public addBoard = addBoard;
    public deleteBoard = deleteBoard;
    public disconnectBoard = disconnectBoard;
    public updateBoard = updateBoard;
    public executeActionOnBoard = executeActionOnBoard;
    public stopProgram = stopProgram;
    public executeProgramOnBoard = executeProgramOnBoard;
    public on = on;
}
