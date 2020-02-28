import { LoggerService } from './logger.service';

const namespace = 'test-service';

console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

beforeEach(() => {
    jest.resetAllMocks();
});

describe('LoggerService', () => {
    describe('#getTimestamp', () => {
        test("should return the current timestamp in the format 'DD-MM-YYYY HH:mm:ss.SSS'", () => {
            // @ts-ignore
            const result = LoggerService.getTimestamp();
            const pattern = /^([1-9]|([012][0-9])|(3[01]))-([0]{0,1}[1-9]|1[012])-\d\d\d\d (20|21|22|23|[0-1]?\d):[0-5]?\d:[0-5]?\d.(\d{1,3})$/;

            expect(result).toBeDefined();
            expect(typeof result).toEqual('string');
            expect(result.match(pattern)).toBeDefined();
        });
    });

    describe('#formatMessage', () => {
        test('should return a string with the timestamp', () => {
            const message = 'test-message';

            // @ts-ignore
            const result = LoggerService.formatMessage(message, namespace, true);
            expect(typeof result).toEqual('string');
            expect(result).toContain(message);
            expect(result).toContain(namespace);
        });

        test('should return a string without the timestamp', () => {
            const message = 'test-message';

            // @ts-ignore
            const result = LoggerService.formatMessage(message, namespace, false);
            expect(typeof result).toEqual('string');
            expect(result).toContain(message);
            expect(result).toContain(namespace);
        });
    });

    describe('#debug', () => {
        test('should not print debug message to console if env parameter is not set', () => {
            process.env.debug = '';

            LoggerService.debug('test');
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should print debug message to console when env parameter is set', () => {
            process.env.debug = 'true';

            LoggerService.debug('test');
            expect(console.log).toHaveBeenCalled();
        });
    });

    describe('#info', () => {
        test('should print info message to console', () => {
            LoggerService.info('test');

            expect(console.info).toHaveBeenCalled();
        });
    });

    describe('#warn', () => {
        test('should print warning message to console', () => {
            LoggerService.warn('test');

            expect(console.warn).toHaveBeenCalled();
        });
    });

    describe('#error', () => {
        test('should print error message to console', () => {
            LoggerService.error('test');

            expect(console.error).toHaveBeenCalled();
        });

        test('should print error message to console', () => {
            LoggerService.error(new Error('test'));

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('#stack', () => {
        test('should print error stack to console', () => {
            LoggerService.stack(new Error('test'));

            expect(console.log).toHaveBeenCalled();
        });
    });
});
