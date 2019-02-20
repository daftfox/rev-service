import { EventEmitter } from 'events';
import Board from '../domain/board';
import { Observable } from "rxjs/internal/Observable";
import {concatMap, distinctUntilChanged, filter, map, scan, share, tap} from "rxjs/operators";
import {Subject} from "rxjs/internal/Subject";
import {BoardStatus} from "../interface/discrete-board";
import {BehaviorSubject} from "rxjs/internal/BehaviorSubject";
import {Command} from "../interface/command";
import NotFoundError from "../domain/not-found-error";

class Boards extends EventEmitter {
    private boards$: BehaviorSubject<Board>;
    private boardDisconnected$: Subject<Board>;
    private exec$: Subject<Command>;
    private executeOnBoard$: Observable<Board>;

    constructor() {
        super();
        this.boards$ = new BehaviorSubject<Board>(null);
        this.boardDisconnected$ = new Subject<Board>();
        this.exec$ = new Subject<Command>();
        this.executeOnBoard$ = this.exec$.pipe(
            concatMap( command => this.getBoardById( command.boardId ))
        );
    }

    public get boards(): Observable<Board> {
        return this.boards$.pipe(
            filter( board => board !== null ),
            distinctUntilChanged(),
            share()
        )
    }

    public get getAllBoards(): Observable<Board[]> {
        return this.boards.pipe(
            scan( ( acc: Board[], cur: Board ) => [...acc, cur], [] ),
            map( boards => boards.filter( board => board.status !== BoardStatus.DISCONNECTED ) ), // filter out disconnected boards
        );
    }

    public getBoardById( id: string ): Observable<Board> {
        return this.boards.pipe(
            scan( ( acc: Board[], cur: Board ) => [...acc, cur], [] ),
            filter( board => board !== null ),
            map( boards => boards.find( board => board.id === id ) )
        );
    }

    public get boardDisconnected(): Observable<Board> {
        return this.boardDisconnected$.asObservable();
    }

    public addBoard( board: Board ): void {
        this.boards$.next( board );
    }

    public removeBoard( board: Board ): void {
        this.boardDisconnected$.next( board );
    }

    public executeOnBoard( command: Command ): void {
        this.executeOnBoard$.subscribe(
            board => {
                if ( !board ) throw new NotFoundError( `Board not found` );
                board.executeCommand( command );
            }
        );
        this.exec$.next( command );
    }
}

export default Boards;