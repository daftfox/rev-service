import { EventEmitter } from 'events';
import Board from '../domain/board';
import { Observable } from "rxjs/internal/Observable";
import { concatMap, distinctUntilChanged, filter, map, scan, share } from "rxjs/operators";
import {Subject} from "rxjs/internal/Subject";
import {BoardStatus} from "../interface/discrete-board";
import {BehaviorSubject} from "rxjs/internal/BehaviorSubject";

class Boards extends EventEmitter {
    private boards$: BehaviorSubject<Board>;
    private boardDisconnected$: Subject<Board>;
    private exec$: Subject<{ id: string, command: string, parameter?: string }>;
    private executeOnBoard$: Observable<Board>;

    constructor() {
        super();
        this.boards$ = new BehaviorSubject<Board>(null);
        this.boardDisconnected$ = new Subject<Board>();
        this.exec$ = new Subject<{id: string, command: string, parameter?: string}>();
        this.executeOnBoard$ = this.exec$.pipe(
            concatMap( exec => this.getBoardById( exec.id ))
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

    public executeOnBoard( exec: { id: string, command: string, parameter?: string } ): void {
        this.executeOnBoard$.subscribe(
            board => board.executeCommand( exec.command, exec.parameter )
        );
        this.exec$.next( exec );
    }
}

export default Boards;