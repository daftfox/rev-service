import Board, {IDLE} from '../domain/board';
import LoggerService from '../service/logger-service';
import Chalk from 'chalk';
import IBoard from "../domain/interface/board";
import NotFound from "../domain/web-socket-message/error/not-found";
import BadRequest from "../domain/web-socket-message/error/bad-request";
import ServerError from "../domain/web-socket-message/error/server-error";
import MajorTom from "../domain/major-tom";
import * as FirmataBoard from 'firmata';
import ICommand from "../domain/interface/command";
import Program from "../domain/program";
import Conflict from "../domain/web-socket-message/error/conflict";
import MethodNotAllowed from "../domain/web-socket-message/error/method-not-allowed";
import LedController from "../domain/led-controller";

/**
 * @description Data model for storing and sharing {@link Board}/{@link IBoard} instances across services.
 * @namespace Boards
 */
class Boards {

    /**
     * Static object containing types that are currently supported by the system.
     *
     * @static
     * @type {object}
     */
    private static AVAILABLE_TYPES = {
        MAJORTOM: 'MajorTom',
        BOARD: "Board",
        LEDCONTROLLER: "LedController",
    };

    /**
     * Namespace used by the local instance of {@link LoggerService}
     *
     * @static
     * @access private
     * @type {string}
     */
    private static namespace = 'board-model';

    /**
     * Local instance of the {@link LoggerService} class.
     *
     * @static
     * @access private
     * @type {LoggerService}
     */
    private static log = new LoggerService( Boards.namespace );

    /**
     * Locally stored array of {@link Board} instances that are currently online.
     * This is pre-filled with devices retrieved from the data storage.
     *
     * @access private
     * @type {Board[]}
     */
    private _boards: Board[] = [];

    /**
     * Array of listener methods that are called as soon as a new {@link Board} instance was added to the {@link _boards} array.
     * The newly added {@link IBoard} is passed to the listener method as an argument.
     *
     * @type {(function(IBoard) => void)[]}
     */
    private boardConnectedListeners: ( ( board: IBoard, newRecord: boolean ) => void )[] = [];

    /**
     * Array of listener methods that are called as soon as a {@link Board} instance has updated.
     * The updated {@link IBoard} is passed to the listener method as an argument.
     *
     * @type {(function(IBoard) => void)[]}
     */
    private boardUpdatedListeners: ( ( board: IBoard ) => void )[] = [];

    /**
     * Array of listener methods that are called as soon as a {@link Board} instance was removed from the {@link _boards} array.
     * The removed {@link IBoard} is passed to the listener method as an argument.
     *
     * @type {(function(IBoard) => void)[]}
     */
    private boardDisconnectedListeners: ( ( board: IBoard ) => void )[] = [];

    constructor() {

    }

    public synchronise(): Promise<void> {
        return Board.findAll()
            .then( boards => {
                this._boards = boards.map( board => Boards.instantiateBoard( board ) );
            } );
    }

    /**
     * Create an instance of a {@link Board} reflecting its type.
     * Currently supported types are {@link Board} (default) and {@link MajorTom}, as dictated by {@link Boards.AVAILABLE_TYPES}.
     *
     * @param {Board} board - {@link Board} instance used to feed data values into the newly constructed instance.
     * @param {boolean} serialConnection - Is the board connected over a serial connection.
     * @param {FirmataBoard} [firmataBoard] - Connected instance of {@link FirmataBoard} to attach to the newly created instance.
     * @returns {Board} New instance of {@link Board} or {@link MajorTom}.
     */
    public static instantiateBoard( board: Board, serialConnection: boolean = false, firmataBoard?: FirmataBoard ): Board {
        let boardInstance: Board;

        const dataValues = {
            id: board.id,
            name: board.name,
            type: board.type,
            lastUpdateReceived: board.lastUpdateReceived,
        };

        switch( board.type ) {
            case 'MajorTom':
                boardInstance = new MajorTom( dataValues, { isNewRecord: board.isNewRecord }, firmataBoard, serialConnection );
                break;
            case 'LedController':
                boardInstance = new LedController( dataValues, { isNewRecord: board.isNewRecord }, firmataBoard, serialConnection );
                break;
            default:
                boardInstance = new Board( dataValues, { isNewRecord: board.isNewRecord }, firmataBoard, serialConnection );
                break;
        }

        return boardInstance;
    }

    /**
     * Add a new listener method to be called as soon as a new {@link Board} instance has online.
     *
     * @access public
     * @param {(IBoard) => void} listener - Callback method to execute when a {@link Board} instance has online.
     * @returns {void}
     */
    public addBoardConnectedListener( listener: ( board: IBoard, newRecord: boolean ) => void ): void {
        this.boardConnectedListeners.push( listener );
    }

    /**
     * Add a new listener method to be called as soon as a {@link Board} instance has updated.
     *
     * @access public
     * @param {(IBoard) => void} listener - Callback method to execute when a {@link Board} instance has been updated.
     * @returns {void}
     */
    public addBoardUpdatedListener( listener: ( IBoard ) => void ): void {
        this.boardUpdatedListeners.push( listener );
    }

    /**
     * Add a new listener method to be called as soon as a {@link Board} instance has online.
     *
     * @access public
     * @param {(IBoard) => void} listener - Callback method to execute when a {@link Board} instance has been disconnected.
     * @returns {void}
     */
    public addBoardDisconnectedListener( listener: ( IBoard ) => void ): void {
        this.boardDisconnectedListeners.push( listener );
    }

    /**
     * Returns an array of the currently online boards.
     *
     * @access public
     * @return {IBoard[]} An array of objects implementing the {@link IBoard} interface, representing the currently online boards.
     */
    public get boards(): IBoard[] {
        return Board.toDiscreteArray( this._boards );
    }

    /**
     * Returns the {@link Board} instance with the id supplied in the argument.
     *
     * @access public
     * @throws {BadRequest} Board id parameter missing.
     * @throws {NotFound} Board could not be found.
     * @param {string} id - ID of the {@link Board} instance to retrieve.
     * @return {IBoard} If found, an object implementing the {@link IBoard} interface.
     */
    public getBoardById( id: string ): IBoard {
        if ( !id ) {
            throw new BadRequest( `Parameter board id is missing.` );
        }

        const board = this._boards
            .find( board => board.id === id );

        if ( !board ) {
            throw new NotFound( `Board with id ${id} could not be found.` );
        }

        return Board.toDiscrete( board );
    }

    /**
     * Adds {@link Board} instance to the model. If the device is unknown it will be persisted to the data storage.
     *
     * @async
     * @access public
     * @throws {ServerError} Board could not be stored.
     * @param {string} id - ID of the {@link Board} instance to add.
     * @param {string} type - {@link Board} type to use as default to create a new instance if no existing instances can be found.
     * @param {FirmataBoard} firmataBoard - Connected instance of {@link FirmataBoard} to attach to the {@link Board} instance to be returned.
     * @returns {Promise<IBoard>} A promise that resolves to an object implementing the {@link IBoard} interface once the board has been added successfully.
     */
    public async addBoard( id: string, type: string, firmataBoard: FirmataBoard, serialConnection: boolean ): Promise<IBoard> {

        // fill variable with an instance of Board, either retrieved from the data storage, or newly constructed.
        const board = await Boards.findOrBuildBoard( id, type, firmataBoard, serialConnection );
        const newRecord = board.isNewRecord;

        if ( newRecord ) {

            // store the Board in the data storage and append it to the local storage array if it is new
            Boards.log.debug( `Storing new board with id ${ Chalk.rgb( 0, 143, 255 ).bold( board.id ) } in the database.` );

            try {
                await board.save();
            } catch ( error ) {
                throw new ServerError( `Board could not be stored.` );
            }

            this._boards.push( board );

        } else {

            // replace existing Board instance in the local storage array with the newly instantiated Board
            this._boards[ this._boards.findIndex( board => board.id === board.id ) ] = board;

        }

        // retrieve a lean copy of the Board instance
        const discreteBoard = Board.toDiscrete( board );

        this.boardConnectedListeners.forEach( listener => listener( discreteBoard, newRecord ) );
        return Promise.resolve( discreteBoard );
    }

    /**
     * Disconnect a {@link Board} instance and removes it from the database.
     *
     * @access public
     * @param {string} id - ID of the {@link Board} instance to delete.
     * @returns {void}
     */
    public deleteBoard( id: string ): void {
        Boards.log.debug( `Deleting board with id ${ Chalk.rgb( 0, 143, 255 ).bold( id ) } from the database.` );
        this.disconnectBoard( id );
        this._boards.find( board => board.id === id ).destroy();
    }

    /**
     * Disconnect a {@link Board} instance and notify subscribers.
     *
     * @access public
     * @param {string} id - ID of the {@link Board} instance to disconnect.
     * @returns {void}
     */
    public disconnectBoard( id: string ): void {
        Boards.log.debug( `Setting board with id ${ Chalk.rgb( 0, 143, 255 ).bold( id ) }'s status to disconnected.` );

        const board = this._boards.find( board => board.id === id );

        if ( board ) {
            board.disconnect();
            board.save();

            const discreteBoard = Board.toDiscrete( board );
            const index = this._boards.findIndex( board => board.id === id );
            this._boards[ index ] = board;

            this.boardDisconnectedListeners.forEach( listener => listener( discreteBoard ) );
        }
    }

    /**
     * Update a {@link Board} and notify subscribers.
     *
     * @access public
     * @throws {BadRequest} The provided type is not a valid type.
     * @throws {BadRequest} Parameter board id is missing.
     * @throws {BadRequest} Parameter board is missing.
     * @param {IBoard} boardUpdates - Object implementing the {@link IBoard} interface containing updated values for an existing {@link Board} instance.
     * @param {boolean} [persist = false] - Persist the changes to the data storage.
     * @returns {void}
     */
    public updateBoard( boardUpdates: IBoard, persist: boolean = false ): void {
        if ( !boardUpdates ) {
            throw new BadRequest( `Parameter board is missing.` );
        }

        if ( !boardUpdates.id ) {
            throw new BadRequest( `Parameter board id is missing.` );
        }

        let board = this._boards.find( board => board.id === boardUpdates.id );

        if ( board ) {

            // do not allow the user to change the Board.type property into an unsupported value
            if ( boardUpdates.type && !Object.values( Boards.AVAILABLE_TYPES ).includes( boardUpdates.type ) )  {
                throw new BadRequest( `Type '${ boardUpdates.type }' is not a valid type. Valid types are${ Object.values( Boards.AVAILABLE_TYPES ).map( type => ` '${ type }'` ) }.` );
            }

            // update existing board values
            Object.assign( board, boardUpdates );

            if ( persist ) {

                // persist instance changes to the data storage
                Boards.log.debug( `Storing update for board with id ${ Chalk.rgb( 0, 143, 255 ).bold( boardUpdates.id ) } in the database.` );
                board.save();

                if ( board.previous( 'architecture' ) && board.previous( 'architecture' ) !== board.getDataValue( 'architecture' ) ) {
                    board.setArchitecture( board.architecture );
                }

                // re-instantiate previous board to reflect type changes
                if ( board.previous( 'type' ) && board.previous( 'type' ) !== board.getDataValue( 'type' ) ) {
                    const index = this._boards.findIndex( board => board.id === boardUpdates.id );

                    // clear non-essential timers and listeners
                    if ( board.online ) {
                        this._boards[ index ].clearAllTimers();
                    }

                    // create new instance if board is online and attach the existing online FirmataBoard instance to it
                    board = Boards.instantiateBoard( board, board.serialConnection, board.getFirmataBoard() );
                    this._boards[ index ] = board;
                }
            }

            const discreteBoard = Board.toDiscrete( board );

            this.boardUpdatedListeners.forEach( listener => listener( discreteBoard ) );
        }
    }

    /**
     * Execute an action on {@link Board} belonging to the supplied ID.
     *
     * @access public
     * @throws {MethodNotAllowed} Requested action not available for board.
     * @param {string} id - ID of the {@link Board} instance to execute the action on.
     * @param {ICommand} command - Command to execute.
     * @returns {Promise<void>} A promise that resolves once the action has been executed successfully.
     */
    public executeActionOnBoard( id: string, command: ICommand ): Promise<void> {
        const board = this._boards.find( board => board.id === id );
        let timeout;

        return new Promise( ( resolve, reject ) => {
            try {
                board.executeAction( command.action, command.parameters );
                timeout = setTimeout( resolve, command.duration || 100 );
            } catch ( error ) {
                clearTimeout( timeout );
                reject( new MethodNotAllowed( error.message ) );
            }
        } );
    }

    /**
     * Stop a {@link Board} instance from running its current {@link Program}.
     *
     * @access public
     * @param {string} id - ID of the {@link Board} instance that should stop running its {@link Program}.
     */
    public stopProgram( id: string ): void {
        const board = this._boards.find( board => board.id === id );
        board.currentProgram = IDLE;
    }

    /**
     * Executes the program on the supplied board.
     *
     * @async
     * @access public
     * @throws {Conflict} Board is already busy running a program.
     * @throws {MethodNotAllowed} Program cannot be run on this board.
     * @param {string} id - ID of the board to execute the program on.
     * @param {Program} program - The program to execute.
     * @param {number} [repeat = 1] - How often the program should be executed. Set to -1 for indefinitely.
     * @returns {Promise<void>} Promise that resolves once the program has executed successfully.
     */
    public async executeProgramOnBoard( id: string, program: Program, repeat: number = 1 ): Promise<void> {
        const board = this._boards.find( board => board.id === id );

        // do not allow the user to execute a program on the board if it is already busy executing one
        if ( board.currentProgram !== IDLE ) {
            return Promise.reject( new Conflict( `Board with id ${ board.id } is already running a program (${ board.currentProgram }). Stop the currently running program or wait for it to finish.` ) );
        }

        // do not allow the user to execute a program on the board if the program doesn't support the board
        if ( program.deviceType !== board.type && program.deviceType !== 'all'  ) {
            return Promise.reject( new MethodNotAllowed( `The program ${ program.name } cannot be run on board with id ${ id }, because it is of the wrong type. Program ${ program.name } can only be run on devices of type ${ program.deviceType }.` ) );
        }

        // set the board's current program status
        board.currentProgram = program.name;

        const discreteBoard = Board.toDiscrete( board );

        try {
            if ( repeat === -1 ) {

                // execute program indefinitely
                while ( board.currentProgram !== program.name ) {
                    await this.runProgram( discreteBoard, program );
                }

            } else {

                // execute program n times
                for ( let repetition = 0; repetition < repeat; repetition++ ) {
                    await this.runProgram( discreteBoard, program );
                }
            }
        } catch ( error ) {
            new MethodNotAllowed( error.message );
        }

        // set the board's current program status to 'idle'
        this.stopProgram( board.id );

        return Promise.resolve();
    }

    /**
     * Find or instantiate a {@link Board} instance.
     *
     * @async
     * @static
     * @access private
     * @param {string} id - ID of the {@link Board} instance to retrieve.
     * @param {string} type - {@link Board.AVAILABLE_TYPES} type to use as default to create a new {@link Board} instance if no existing instances can be found.
     * @param {FirmataBoard} firmataBoard - Connected instance of {@link FirmataBoard} to attach to the {@link Board} instance to be returned.
     * @returns {Promise<Board>} Promise that resolves to an instance of {@link Board} after an instance has been found or created.
     */
    private static async findOrBuildBoard( id: string, type: string, firmataBoard: FirmataBoard, serialConnection: boolean ): Promise<Board> {
        let [ board ] = await Board.findOrBuild( {
            where: {
                id: id,
            },
            defaults: {
                id: id,
                type: type,
            }
        });

        board = Boards.instantiateBoard( board, serialConnection, firmataBoard );

        return Promise.resolve( board );
    }

    /**
     * Run a {@link Program} on a {@link Board}.
     *
     * @async
     * @private
     * @access private
     * @param {IBoard} board - Discrete board instance to run {@link Program} on.
     * @param {Program} program - {@link Program} to run.
     * @returns {Promise<void>} Promise that resolves when a program has finished running.
     */
    private async runProgram( board: IBoard, program: Program ): Promise<void> {
        for ( let command of program.getCommands() ) {

            // stop executing the program as soon as the board's program status changes
            if ( board.currentProgram !== program.name ) {
                break;
            }

            try {
                await this.executeActionOnBoard( board.id, command );
            } catch ( error ) {
                return Promise.reject( error );
            }
        }

        return Promise.resolve();
    }
}

export default Boards;
