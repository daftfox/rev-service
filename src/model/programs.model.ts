import LoggerService from '../service/logger.service';
import Chalk from 'chalk';
import Program from '../domain/program';
import IProgram from '../domain/interface/program';
import { NotFound } from '../error/errors';

/**
 * @classdesc Data model for storing and sharing {@link Program} instances across services.
 * @namespace ProgramsModel
 */
class ProgramsModel {
    /**
     * Namespace used by the local instance of {@link LoggerService}
     */
    private static namespace = 'program-model';

    /**
     * Locally stored array of programs that are currently stored in the database.
     */
    private _programs: Program[] = [];

    /**
     * Local instance of the {@link LoggerService} class.
     */
    private log = new LoggerService(ProgramsModel.namespace);

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
            throw new NotFound(`Program with id ${programId} could not be found.`);
        }

        return program;
    }

    /**
     * Add a new program.
     */
    public addProgram(program: Program): Promise<string> {
        this.log.debug(
            `Adding new program ${Chalk.rgb(0, 143, 255).bold(program.name)} to list of available programs.`,
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

        this.log.debug(`Removing program ${Chalk.rgb(0, 143, 255).bold(program.id)} from list of available programs.`);
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

export default ProgramsModel;
