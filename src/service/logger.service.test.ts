import { LoggerService } from './logger.service';

const namespace = 'test-service';
const message = 'test-message';
const properties = {
    getTimestamp: 'getTimestamp',
    formatMessage: 'formatMessage',
    formatNamespace: 'formatNamespace',
    formatStack: 'formatStack',
    formatErrorMessage: 'formatErrorMessage',
    highlight: 'highlight',
    getRGBFromColor: 'getRGBFromColor',
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
    stack: 'stack',
    appName: 'appName',
};

describe('LoggerService', () => {
    describe('#getTimestamp', () => {
        test("should return the current timestamp in the format 'DD-MM-YYYY HH:mm:ss.SSS'", () => {
            const result = LoggerService[properties.getTimestamp]();
            const pattern = /^([1-9]|([012][0-9])|(3[01]))-([0]{0,1}[1-9]|1[012])-\d\d\d\d (20|21|22|23|[0-1]?\d):[0-5]?\d:[0-5]?\d.(\d{1,3})$/;

            expect(result).toBeDefined();
            expect(typeof result).toEqual('string');
            expect(result.match(pattern)).toBeDefined();
        });
    });

    describe('#formatMessage', () => {
        test('should return a string with the timestamp', () => {
            const result = LoggerService[properties.formatMessage](message, namespace, true);
            expect(result).toContain(message);
            expect(result).toContain(namespace);
        });

        test('should return a string without the timestamp', () => {
            const fakeTimestamp = '01-02-1990 00:00:00.001';
            spyOn<any>(LoggerService, 'getTimestamp').and.returnValue(fakeTimestamp);

            const result = LoggerService[properties.formatMessage](message, namespace, false);
            expect(result).toContain(message);
            expect(result).toContain(namespace);
            expect(result).not.toContain(fakeTimestamp);
        });

        test('should return a string without the namespace', () => {
            const result = LoggerService[properties.formatMessage](message, undefined, false);
            expect(result).toContain(message);
            expect(result).not.toContain(namespace);
        });
    });

    describe('#highlight', () => {
        test('should return the message in bold', () => {
            const result = LoggerService[properties.highlight](message, undefined, true);

            expect(result).toContain('[1m');
        });

        test('should not return the message in bold', () => {
            const result = LoggerService[properties.highlight](message, undefined, false);

            expect(result).not.toContain('[1m');
        });
    });

    describe('#getRGBFromColor', () => {
        test.each([
            ['orange', { red: 255, green: 136, blue: 0 }],
            ['yellow', { red: 240, green: 240, blue: 30 }],
            ['green', { red: 67, green: 230, blue: 145 }],
            ['blue', { red: 0, green: 143, blue: 255 }],
            [undefined, { red: 0, green: 143, blue: 255 }],
        ])(
            'should return the correct RGB values',
            (color: string, rgb: { red: number; green: number; blue: number }) => {
                const result = LoggerService[properties.getRGBFromColor](color);

                expect(result).toEqual(rgb);
            },
        );
    });

    describe('#debug', () => {
        test('should not print debug message to console if env parameter is not set', () => {
            process.env.debug = '';
            const spy = spyOn(global.console, 'log');

            LoggerService[properties.debug]('test');
            expect(spy).not.toHaveBeenCalled();
        });

        test('should print debug message to console when env parameter is set', () => {
            process.env.debug = 'true';
            const spy = spyOn(global.console, 'log');

            LoggerService.debug('test');
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('#info', () => {
        test('should print info message to console', () => {
            const spy = spyOn(global.console, 'info');
            LoggerService.info('test');

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('#warn', () => {
        test('should print warning message to console', () => {
            const spy = spyOn(global.console, 'warn');
            LoggerService.warn('test');

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('#error', () => {
        test('should print error message to console', () => {
            const spy = spyOn(global.console, 'error');
            LoggerService.error('test');

            expect(spy).toHaveBeenCalled();
        });

        test('should print error message to console', () => {
            const spy = spyOn(global.console, 'error');
            LoggerService.error(new Error('test'));

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('#stack', () => {
        test('should print error stack to console', () => {
            const spy = spyOn(global.console, 'log');
            LoggerService.stack(new Error('test'));

            expect(spy).toHaveBeenCalled();
        });
    });
});
