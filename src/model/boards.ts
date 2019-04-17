import Board from '../domain/board';
import {Command} from "../interface/command";
import NotFoundError from "../error/not-found-error";

/**
 * @classdesc
 * @namespace Boards
 */
class Boards {
    /**
     * @access private
     * @type {Board[]}
     */
    private _boards: Board[];

    private notifyBoardConnectedListeners: (( Board ) => void)[];

    private notifyBoardDisconnectedListeners: (( Board ) => void)[];

    /**
     * @constructor
     */
    constructor() {
        this._boards = [];
        this.notifyBoardConnectedListeners = [];
        this.notifyBoardDisconnectedListeners = [];
    }

    public addBoardConnectedListener( listener: ( Board ) => void ): void {
        this.notifyBoardConnectedListeners.push( listener );
    }

    public addBoardDisconnectedListener( listener: ( Board ) => void ): void {
        this.notifyBoardDisconnectedListeners.push( listener );
    }

    /**
     * Returns an array of the currently connected boards
     * @access public
     * @return {Board[]}
     */
    public get boards(): Board[] {
        return this._boards;
    }

    /**
     * Returns an observable containing the board with the id supplied in the argument
     * @access public
     * @param {string} id
     * @return {Observable<Board>}
     */
    public getBoardById( id: string ): Board {
        return this._boards.find( board => board.id === id );
    }

    /**
     * Add a new board and notify subscribers
     * @access public
     * @param {Board} board
     */
    public addBoard( board: Board ): void {
        this._boards.push( board );
        this.notifyBoardConnectedListeners.forEach( listener => listener( Board.toDiscrete( board ) ) );

    }

    /**
     * Register the supplied board as disconnected and notify subscribers
     * @access public
     * @param {string} boardId
     */
    public removeBoard( boardId: string ): void {
        const removedBoard = this._boards.splice( this._boards.findIndex( board => board.id === boardId ), 1 ).shift();
        removedBoard.clearAllTimers();
        this.notifyBoardDisconnectedListeners.forEach( listener => listener( Board.toDiscrete( removedBoard ) ) );
    }

    /**
     * Consumes a Command object and executes it on the board specified by its boardId property
     * @access public
     * @param {Command} command
     */
    public executeCommand( command: Command ): void {
        const board = this._boards.find( board => board.id === command.boardId );

        if ( !board ) throw new NotFoundError( `Board with id ${command.boardId} not found` );
        else {
            board.executeCommand( command );
        }
    }
}

export default Boards;