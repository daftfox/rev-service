import { LoggerService } from './logger.service';
import { IProgram, Program } from '../domain/program';
import { ProgramNotFoundError } from '../domain/error';

/**
 * @classdesc Data model for storing and sharing {@link Program} instances across services.
 * @namespace ProgramService
 */
export class ProgramService {
    /**
     * Namespace used by the local instance of {@link LoggerService}
     */
    private namespace = 'program-service';

    /**
     * Locally stored array of programs that are currently stored in the database.
     */
    private _programs: Program[] = [];

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
    public addProgram(program: Program): Promise<string> {
        LoggerService.debug(
            `Adding new program ${LoggerService.highlight(program.name, 'blue', true)} to list of available programs.`,
            this.namespace
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
            this.namespace
        );
        this._programs.splice(this._programs.findIndex(({ id }) => id === program.id), 1);
        return program.destroy();
    }

    /**
     * Update program.
     */
    public async updateProgram(programUpdates: IProgram): Promise<void> {
        const program = await this.getProgramById(programUpdates.id);

        return program.update(programUpdates);
    }
}
