import { EventEmitter } from 'events';
import Board, {BoardStatus} from '../domain/board';
import { Observable } from "rxjs/internal/Observable";
import {distinctUntilChanged, filter, map, scan, share, tap} from "rxjs/operators";
import {Subject} from "rxjs/internal/Subject";

class Boards extends EventEmitter {
    private boards$: Subject<Board>;
    private boardDisconnected$: Subject<Board>;

    constructor() {
        super();
        this.boards$ = new Subject<Board>();
        this.boardDisconnected$ = new Subject<Board>();
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
            filter( board => board !== null ),
            scan( ( acc: Board[], cur: Board ) => [...acc, cur], [] ),
            map( boards => boards.find( board => board.id === id ) ),
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
}

export default Boards;