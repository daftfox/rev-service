"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../service/logger");
const chalk_1 = require("chalk");
const program_1 = require("../domain/program");
const not_found_1 = require("../domain/web-socket-message/error/not-found");
const bad_request_1 = require("../domain/web-socket-message/error/bad-request");
/**
 * @classdesc Data model for storing and sharing {@link Program} instances across services.
 * @namespace Programs
 */
class Programs {
    constructor() {
        /**
         * Locally stored array of programs that are currently stored in the database.
         *
         * @access private
         * @type {Board[]}
         */
        this._programs = [];
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
         * Local instance of the {@link Logger} class.
         *
         * @access private
         * @type {Logger}
         */
        this.log = new logger_1.default(Programs.namespace);
    }
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
    get programs() {
        return program_1.default.findAll();
    }
    /**
     * Returns the program with the id supplied in the argument.
     *
     * @access public
     * @param {string} id
     * @return {Program}
     */
    getProgramById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                return Promise.reject(new bad_request_1.default(`Parameter program id is missing.`));
            }
            const program = yield program_1.default.findOne({
                where: {
                    id: id,
                },
            });
            if (!program) {
                return Promise.reject(new not_found_1.default(`Program with id ${id} could not be found.`));
            }
            return Promise.resolve(program);
        });
    }
    /**
     * Add a new program.
     *
     * @access public
     * @param {Program} program
     * @returns {void}
     */
    addProgram(program) {
        if (!program) {
            return Promise.reject(new bad_request_1.default(`Parameter program is missing.`));
        }
        const newProgram = new program_1.default({ name: program.name, deviceType: program.deviceType });
        if (program.commands) {
            newProgram.setCommands(program.commands);
        }
        this.log.debug(`Adding new program ${chalk_1.default.rgb(0, 143, 255).bold(program.name)} to list of available programs.`);
        return newProgram.save()
            .then(program => program.id);
    }
    /**
     * Remove the program with the supplied id.
     *
     * @access public
     * @param {string} id
     * @returns {void}
     */
    removeProgram(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                return Promise.reject(new bad_request_1.default(`Parameter program id is missing.`));
            }
            const program = yield this.getProgramById(id);
            if (!program) {
                return Promise.reject(new not_found_1.default(`Program with id ${id} could not be found.`));
            }
            this.log.debug(`Removing program ${chalk_1.default.rgb(0, 143, 255).bold(id)} from list of available programs.`);
            return program.destroy();
        });
    }
    /**
     * Update program.
     *
     * @access public
     * @param {IProgram} updatedProgram
     * @returns {void}
     */
    updateProgram(id, updatedProgram) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                return Promise.reject(new bad_request_1.default(`Parameter program id is missing.`));
            }
            if (!updatedProgram) {
                return Promise.reject(new bad_request_1.default(`Parameter program is missing.`));
            }
            const program = yield this.getProgramById(id);
            if (updatedProgram.commands) {
                program.setCommands(updatedProgram.commands);
            }
            Object.assign(program, { name: updatedProgram.name, deviceType: updatedProgram.deviceType });
            return program.save();
        });
    }
}
/**
 * Namespace used by the local instance of {@link Logger}
 *
 * @static
 * @access private
 * @type {string}
 */
Programs.namespace = 'program-model';
exports.default = Programs;
//# sourceMappingURL=programs.js.map