import * as Chalk from 'chalk';
import * as moment from 'moment';

/**
 * @classdesc
 * @namespace LoggerService
 */
export class LoggerService {
    private static appName = `rev`;

    /**
     * @access private
     * @returns {string} Timestamp
     */
    private static getTimestamp(): string {
        return moment().format('DD-MM-YYYY HH:mm:ss.SSS');
    }

    /**
     * @access private
     * @param {string} namespace
     * @param {string | Error} message
     * @param {boolean} addTimestamp Add timestamp to logged message
     * @returns {string} Formatted message
     */
    private static formatMessage(message: string | Error, namespace?: string, addTimestamp: boolean = true): string {
        return `${addTimestamp ? LoggerService.getTimestamp() : ''} ${Chalk.red.bold(LoggerService.appName)}${
            namespace ? LoggerService.formatNamespace(namespace) : ''
        } ${message}`;
    }

    private static formatNamespace(namespace: string): string {
        return `${Chalk.rgb(255, 136, 0).bold(`:${namespace.padEnd(20, ' ')}`)}`;
    }

    private static formatStack(error: Error): string {
        return error.stack.replace(/Error: /g, '');
    }

    private static formatErrorMessage(error: Error | string): string {
        return typeof error !== 'string'
            ? (error as Error).message.replace(/Error: /g, '') // No need to say error three times
            : (error as string);
    }

    public static highlight(text: string, color?: string, bold?: boolean): string {
        let highlightedString = text;
        if (bold) {
            highlightedString = Chalk.bold(text);
        }

        const rgb = LoggerService.getRGBFromColor(color);

        return Chalk.rgb(rgb.red, rgb.green, rgb.blue)(highlightedString);
    }

    private static getRGBFromColor(color: string): { red: number; green: number; blue: number } {
        const rgb = {
            red: 0,
            green: 0,
            blue: 0,
        };

        switch (color) {
            case 'orange':
                rgb.red = 255;
                rgb.green = 136;
                rgb.blue = 0;
                break;
            case 'yellow':
                rgb.red = 240;
                rgb.green = 240;
                rgb.blue = 30;
                break;
            case 'green':
                rgb.red = 67;
                rgb.green = 230;
                rgb.blue = 145;
                break;
            case 'blue':
            default:
                rgb.red = 0;
                rgb.green = 143;
                rgb.blue = 255;
        }

        return rgb;
    }

    /**
     * @access public
     * @param {string} message
     */
    public static debug(message: string, namespace?: string): void {
        if (process.env.debug) {
            console.log(`${Chalk.black.bgWhite('DEBUG')} ${LoggerService.formatMessage(message, namespace)}`);
        }
    }

    /**
     * @access public
     * @param {string} message
     */
    public static info(message: string, namespace?: string): void {
        console.info(`${Chalk.black.bgBlue(' INFO')} ${LoggerService.formatMessage(message, namespace)}`);
    }

    /**
     * @access public
     * @param {string} message
     */
    public static warn(message: string, namespace?: string): void {
        console.warn(`${Chalk.black.bgYellow(' WARN')} ${LoggerService.formatMessage(message, namespace)}`);
    }

    /**
     * @access public
     * @param {Error} error
     */
    public static error(error: Error | string, namespace?: string): void {
        console.error(
            `${Chalk.black.bgRed('ERROR')} ${LoggerService.formatMessage(
                LoggerService.formatErrorMessage(error),
                namespace,
            )}`,
        );
    }

    /**
     * @access public
     * @param {Error} error
     */
    public static stack(error: Error, namespace?: string): void {
        console.log(
            `${Chalk.black.bgRed('ERROR')} ${LoggerService.formatMessage(LoggerService.formatStack(error), namespace)}`,
        );
    }
}
