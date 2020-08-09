import { LoggerService } from './logger.service';
import { ICommand, IProgram, Program } from '../domain/program';
import { BoardIncompatibleError, BoardUnavailableError, ProgramNotFoundError } from '../domain/error';
import { BoardService } from './board.service';
import { container } from 'tsyringe';
import { IDLE } from '../domain/board/base';
import { IBoard } from '../domain/board/interface';

/**
 * @classdesc Data model for storing and sharing {@link Program} instances across services.
 * @namespace ProgramService
 */
export class ProgramService {
    /**
     * Namespace used by the local instance of {@link LoggerService}
     */
    private namespace = 'program-service';
    private boardService: BoardService;

    /**
     * Locally stored array of programs that are currently stored in the database.
     */
    private _programs: Program[] = [];

    constructor() {
        this.boardService = container.resolve(BoardService);
    }

    public static createProgram(program: IProgram): Program {
        return new Program({ name: program.name, deviceType: program.deviceType, commands: program.commands });
    }

    public synchronise(): Promise<void> {
        return Program.findAll().then(programs => {
            this._programs = programs;
        });
    }

    /**
     * Returns an array of the currently available programs.
     */
    public getAllPrograms(): Program[] {
        return this._programs;
    }

    /**
     * Returns the program with the id supplied in the argument.
     */
    public getProgramById(programId: string): Program {
        const program = this._programs.find(({ id }) => id === programId);

        if (!program) {
            throw new ProgramNotFoundError(`Program with id ${programId} could not be found.`);
        }

        return program;
    }

    /**
     * Add a new program.
     */
    public addProgram(program: Program): Promise<Program> {
        LoggerService.debug(
            `Adding new program ${LoggerService.highlight(program.name, 'blue', true)} to list of available programs.`,
            this.namespace,
        );
        this._programs.push(program);
        return program.save();
    }

    /**
     * Remove the program with the supplied id.
     *
     * @access public
     * @param {string} id
     * @returns {void}
     */
    public deleteProgram(programId: string): Promise<void> {
        const program = this.getProgramById(programId);

        LoggerService.debug(
            `Removing program ${LoggerService.highlight(program.id, 'blue', true)} from list of available programs.`,
            this.namespace,
        );
        this._programs.splice(
            this._programs.findIndex(({ id }) => id === program.id),
            1,
        );
        return program.destroy();
    }

    /**
     * Update program.
     */
    public async updateProgram(programUpdates: IProgram): Promise<Program> {
        const program = await this.getProgramById(programUpdates.id);

        return program.update(programUpdates);
    }

    public executeCommandOnBoard(boardId: string, command: ICommand): Promise<void> {
        const board = this.boardService.getBoardById(boardId);
        let timeout;

        return new Promise((resolve, reject) => {
            try {
                board.executeAction(command.action, command.parameters);
                timeout = setTimeout(resolve, command.duration || 100);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Stop a {@link Board} instance from running its current {@link Program}.
     */
    public stopProgram(id: string): void {
        const board = this.boardService.getBoardById(id);
        board.currentProgram = IDLE;
    }

    /**
     * Executes the program on the supplied board.
     */
    public async executeProgramOnBoard(id: string, program: Program, repeat: number = 1): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const board = this.boardService.getBoardById(id);

            // do not allow the user to execute a program on the board if it is already busy executing one
            if (board.currentProgram !== IDLE) {
                reject(
                    new BoardUnavailableError(
                        `Board with id ${board.id} is already running a program (${board.currentProgram}). Stop the currently running program or wait for it to finish.`,
                    ),
                );
                return;
            }

            // do not allow the user to execute a program on the board if the program doesn't support the board
            if (program.deviceType !== board.type && program.deviceType !== 'all') {
                reject(
                    new BoardIncompatibleError(
                        `The program ${program.name} cannot be run on board with id ${board.id}, because it is of the wrong type. Program ${program.name} can only be run on devices of type ${program.deviceType}.`,
                    ),
                );
                return;
            }

            // set the board's current program status
            board.currentProgram = program.name;
            const discreteBoard = board.toDiscrete();

            try {
                if (repeat === -1) {
                    // execute program indefinitely
                    while (board.currentProgram === program.name) {
                        await this.runProgram(discreteBoard, program);
                    }
                } else {
                    // execute program n times
                    for (let repetition = 0; repetition < repeat; repetition++) {
                        await this.runProgram(discreteBoard, program);
                    }
                }
            } catch (error) {
                reject(error);
            }

            // set the board's current program status to 'idle'
            this.stopProgram(board.id);
            resolve();
        });
    }

    private async runProgram(board: IBoard, program: Program): Promise<void> {
        return new Promise(async (resolve, reject) => {
            for (const command of program.commands) {
                // stop executing the program as soon as the board's program status changes
                if (board.currentProgram !== program.name) {
                    break;
                }

                try {
                    await this.executeCommandOnBoard(board.id, command);
                } catch (error) {
                    reject(error);
                    return;
                }
            }

            resolve();
            return;
        });
    }
}
