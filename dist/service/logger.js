"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const moment = require("moment");
/**
 * @classdesc
 * @namespace Logger
 */
class Logger {
    constructor(namespace) {
        this.namespace = namespace;
    }
    /**
     * @access public
     * @param {string} message
     */
    debug(message) {
        if (process.env.debug)
            console.log(`${chalk_1.default.black.bgWhite('DEBUG')} ${Logger.formatMessage(this.namespace, message)}`);
    }
    /**
     * @access public
     * @param {string} message
     */
    info(message) {
        console.info(`${chalk_1.default.black.bgBlue(' INFO')} ${Logger.formatMessage(this.namespace, message)}`);
    }
    /**
     * @access public
     * @param {string} message
     */
    warn(message) {
        console.warn(`${chalk_1.default.black.bgYellow(' WARN')} ${Logger.formatMessage(this.namespace, message)}`);
    }
    /**
     * @access public
     * @param {Error} error
     */
    error(error) {
        let errorMessage;
        if (typeof error !== typeof '') {
            errorMessage = error.message.replace(/Error: /g, ''); // No need to say error three times
        }
        else {
            errorMessage = error;
        }
        console.error(`${chalk_1.default.black.bgRed('ERROR')} ${Logger.formatMessage(this.namespace, errorMessage)}`);
    }
    /**
     * @access public
     * @param {Error} error
     */
    stack(error) {
        const stack = error.stack.replace(/Error: /g, ''); // No need to say error three times
        console.log(`${chalk_1.default.black.bgRed('ERROR')} ${Logger.formatMessage(this.namespace, stack)}`);
    }
    /**
     * @access private
     * @returns {string} Timestamp
     */
    static getTimestamp() {
        return moment().format('DD-MM-YYYY HH:mm:ss.SSS');
    }
    /**
     * @access private
     * @param {string} namespace
     * @param {string | Error} message
     * @param {boolean} timestamp Add timestamp to logged message
     * @returns {string} Formatted message
     */
    static formatMessage(namespace, message, timestamp = true) {
        return `${chalk_1.default.red.bold(Logger.serviceName)}:${chalk_1.default.rgb(255, 136, 0).bold(namespace)} ${message} ${timestamp ? Logger.getTimestamp() : ''}`;
    }
}
/**
 * @access private
 * @type {string}
 */
Logger.serviceName = `rev`;
exports.default = Logger;
//# sourceMappingURL=logger.js.map