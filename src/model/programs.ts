import LoggerService from '../service/logger-service';
import Chalk from 'chalk';
import Program from '../domain/program';
import IProgram from '../domain/interface/program';
import NotFound from '../domain/web-socket-message/error/not-found';
import BadRequest from '../domain/web-socket-message/error/bad-request';

/**
 * @classdesc Data model for storing and sharing {@link Program} instances across services.
 * @namespace Programs
 */
class Programs {
    /**
     * Namespace used by the local instance of {@link LoggerService}
     *
     * @static
     * @access private
     * @type {string}
     */
    private static namespace = 'program-model';

    /**
     * Locally stored array of programs that are currently stored in the database.
     *
     * @access private
     * @type {Board[]}
     */
    private _programs: Program[] = [];

    // /**
    //  * Array of listener methods that are called as soon as a new device was added to the {@link _boards} array.
    //  * The newly added {@link Board} is passed to the listener method as an argument.
    //  *
    //  * @type {(function(Board) => void)[]}
    //  */
    // private notifyBoardConnectedListeners: (( Board ) => void)[] = [];
    //
    // /**
    //  * Array of listener methods that are called as soon as a device has updated.
    //  * The updated {@link Board} is passed to the listener method as an argument.
    //  *
    //  * @type {(function(Board) => void)[]}
    //  */
    // private notifyBoardUpdatedListeners: (( Board ) => void)[] = [];
    //
    // /**
    //  * Array of listener methods that are called as soon as a device was removed from the {@link _boards} array.
    //  * The removed {@link Board} is passed to the listener method as an argument.
    //  *
    //  * @type {(function(Board) => void)[]}
    //  */
    // private notifyBoardDisconnectedListeners: (( Board ) => void)[] = [];

    /**
     * Local instance of the {@link LoggerService} class.
     *
     * @access private
     * @type {LoggerService}
     */
    private log = new LoggerService(Programs.namespace);

    // /**
    //  * Add a new listener method to be called as soon as a new board has connected.
    //  *
    //  * @access public
    //  * @param {(Board) => void} listener
    //  * @returns {void}
    //  */
    // public addBoardConnectedListener( listener: ( Board ) => void ): void {
    //     this.notifyBoardConnectedListeners.push( listener );
    // }
    //
    // /**
    //  * Add a new listener method to be called as soon as a board has updated.
    //  *
    //  * @access public
    //  * @param {(Board) => void} listener
    //  * @returns {void}
    //  */
    // public addBoardUpdatedListener( listener: ( Board ) => void ): void {
    //     this.notifyBoardUpdatedListeners.push( listener );
    // }
    //
    // /**
    //  * Add a new listener method to be called as soon as a board has connected.
    //  *
    //  * @access public
    //  * @param {(Board) => void} listener
    //  * @returns {void}
    //  */
    // public addBoardDisconnectedListener( listener: ( Board ) => void ): void {
    //     this.notifyBoardDisconnectedListeners.push( listener );
    // }

    /**
     * Returns an array of the currently available programs.
     *
     * @access public
     * @return {Program[]}
     */
    public get programs(): Promise<Program[]> {
        return Program.findAll();
    }

    /**
     * Returns the program with the id supplied in the argument.
     *
     * @access public
     * @param {string} id
     * @return {Program}
     */
    public async getProgramById(id: string): Promise<Program> {
        if (!id) {
            return Promise.reject(new BadRequest(`Parameter program id is missing.`));
        }

        const program = await Program.findOne({
            where: {
                id,
            },
        });

        if (!program) {
            return Promise.reject(new NotFound(`Program with id ${id} could not be found.`));
        }
        return Promise.resolve(program);
    }

    /**
     * Add a new program.
     *
     * @access public
     * @param {Program} program
     * @returns {void}
     */
    public addProgram(program: IProgram): Promise<string> {
        if (!program) {
            return Promise.reject(new BadRequest(`Parameter program is missing.`));
        }

        const newProgram = new Program({ name: program.name, deviceType: program.deviceType });

        if (program.commands) {
            newProgram.setCommands(program.commands);
        }

        this.log.debug(
            `Adding new program ${Chalk.rgb(0, 143, 255).bold(program.name)} to list of available programs.`,
        );
        return newProgram.save().then(_program => _program.id);
    }

    /**
     * Remove the program with the supplied id.
     *
     * @access public
     * @param {string} id
     * @returns {void}
     */
    public async removeProgram(id: string): Promise<void> {
        if (!id) {
            return Promise.reject(new BadRequest(`Parameter program id is missing.`));
        }

        const program = await this.getProgramById(id);

        if (!program) {
            return Promise.reject(new NotFound(`Program with id ${id} could not be found.`));
        }

        this.log.debug(`Removing program ${Chalk.rgb(0, 143, 255).bold(id)} from list of available programs.`);
        return program.destroy();
    }

    /**
     * Update program.
     *
     * @access public
     * @param {IProgram} updatedProgram
     * @returns {void}
     */
    public async updateProgram(id: string, updatedProgram: IProgram): Promise<void> {
        if (!id) {
            return Promise.reject(new BadRequest(`Parameter program id is missing.`));
        }

        if (!updatedProgram) {
            return Promise.reject(new BadRequest(`Parameter program is missing.`));
        }

        const program = await this.getProgramById(id);

        if (updatedProgram.commands) {
            program.setCommands(updatedProgram.commands);
        }

        Object.assign(program, { name: updatedProgram.name, deviceType: updatedProgram.deviceType });

        return program.save();
    }
}

export default Programs;
