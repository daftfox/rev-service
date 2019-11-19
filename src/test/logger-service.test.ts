import LoggerService from '../service/logger-service';

let logger: any;
const namespace = 'test-service';

beforeEach(() => {
    logger = new LoggerService(namespace);
});

describe('LoggerService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(logger).toBeDefined();
        });

        test('should have set the namespace', () => {
            expect(logger.namespace).toEqual(namespace);
        });
    });

    describe('#getTimestamp', () => {
        test("should return the current timestamp in the format 'DD-MM-YYYY HH:mm:ss.SSS'", () => {
            // @ts-ignore
            const result = LoggerService.getTimestamp();

            expect(result).toBeDefined();
            expect(typeof result).toEqual('string');
        });
    });

    describe('', () => {});

    describe('', () => {});

    describe('', () => {});
});
