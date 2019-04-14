import Board from '../domain/board';
import { Observable } from "rxjs/internal/Observable";
import {concatMap, distinctUntilChanged, filter, map, scan, share} from "rxjs/operators";
import {Subject} from "rxjs/internal/Subject";
import {BoardStatus} from "../interface/discrete-board";
import {BehaviorSubject} from "rxjs/internal/BehaviorSubject";
import {Command} from "../interface/command";
import NotFoundError from "../error/not-found-error";
import BoardError from "../error/board-error";

/**
 * @classdesc
 * @namespace Boards
 */
class Boards {
    /**
     * @access private
     * @type {BehaviorSubject<Board>
     */
    private boards$: BehaviorSubject<Board>;

    /**
     * @access private
     * @type {Subject<Board>
     */
    private boardDisconnected$: Subject<Board>;

    /**
     * @access private
     * @type {Subject<Command>
     */
    private command$: Subject<Command>;

    /**
     * @access private
     * @type {Observable<Board>
     */
    private executeCommand$: Observable<Board>;

    /**
     * @constructor
     */
    constructor() {
        this.boards$ = new BehaviorSubject<Board>(null);
        this.boardDisconnected$ = new Subject<Board>();
        this.command$ = new Subject<Command>();
        this.executeCommand$ = this.command$.pipe(
            concatMap( command => this.getBoardById( command.boardId ))
        );
    }

    /**
     * Returns an observable that can be subscribed to, to handle new boards that get added
     * @access public
     * @return {Observable<Board>}
     */
    public get boards(): Observable<Board> {
        return this.boards$.pipe(
            filter( board => board !== null ),
            distinctUntilChanged(),
            share()
        )
    }

    /**
     * Returns an observable containing all board that have connected since the application initialized
     * @access public
     * @return {Observable<Board[]>}
     */
    public get getAllBoards(): Observable<Board[]> {
        return this.boards.pipe(
            scan( ( acc: Board[], cur: Board ) => [...acc, cur], [] ),
            map( boards => boards.filter( board => board.status !== BoardStatus.DISCONNECTED ) ), // filter out disconnected boards
        );
    }

    /**
     * Returns an observable containing the board with the id supplied in the argument
     * @access public
     * @param {string} id
     * @return {Observable<Board>}
     */
    public getBoardById( id: string ): Observable<Board> {
        return this.boards.pipe(
            scan( ( acc: Board[], cur: Board ) => [...acc, cur], [] ),
            filter( board => board !== null ),
            map( boards => boards.find( board => board.id === id ) )
        );
    }

    /**
     * Returns an observable that notifies subscribers of disconnected boards
     * @access public
     * @return {Observable<Board>}
     */
    public get boardDisconnected(): Observable<Board> {
        return this.boardDisconnected$.asObservable();
    }

    /**
     * Add a new board and notify subscribers
     * @access public
     * @param {Board} board
     */
    public addBoard( board: Board ): void {
        this.boards$.next( board );
    }

    /**
     * Register the supplied board as disconnected and notify subscribers
     * @access public
     * @param {Board} board
     */
    public removeBoard( board: Board ): void {
        board.setStatus( BoardStatus.DISCONNECTED );
        this.boardDisconnected$.next( board );
    }

    /**
     * Consumes a Command object and executes it on the board specified by its boardId property
     * @access public
     * @param {Command} command
     */
    public executeCommand( command: Command ): void {
        this.executeCommand$.subscribe(
            board => {
                if ( !board ) throw new NotFoundError( `Board not found` );
                try {
                    board.executeCommand( command );
                } catch ( error ) {
                    this.removeBoard( board );
                    throw new BoardError( error ) ;
                }
            }
        );
        this.command$.next( command );
    }
}

export default Boards;