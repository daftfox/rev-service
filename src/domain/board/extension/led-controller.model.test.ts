import { Sequelize } from 'sequelize-typescript';
import { Board, FirmataBoard } from '../base';
import { LedController } from './';
import { firmataBoardMockFactory } from '../base/__mocks__/firmata-board.model';

let board: LedController;
let sequelize: Sequelize;
let firmataBoardMock;

const properties = {
    firmataBoard: 'firmataBoard',
    SERIAL_BAUD_RATE: 'SERIAL_BAUD_RATE',
    serialWriteBytes: 'serialWriteBytes',
    executeAction: 'executeAction',
    pulseColor: 'pulseColor',
    setColor: 'setColor',
    kitt: 'kitt',
    rainbow: 'rainbow',
    parametersAreValid: 'parametersAreValid',
    attachFirmataBoard: 'attachFirmataBoard',
};

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([Board]);
});

beforeEach(() => {
    board = new LedController();
    firmataBoardMock = firmataBoardMockFactory();
    board[properties.firmataBoard] = firmataBoardMock;
});

describe('LedController:', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(board).toBeDefined();
        });
    });

    describe('#attachFirmataBoard', () => {
        test('should set firmataBoard serial options', () => {
            board[properties.attachFirmataBoard](firmataBoardMock);

            const serialOptions = {
                portId: firmataBoardMock.SERIAL_PORT_IDs.SW_SERIAL0,
                baud: LedController[properties.SERIAL_BAUD_RATE],
                rxPin: board.architecture.pinMap.RX,
                txPin: board.architecture.pinMap.TX,
            };

            expect(firmataBoardMock.serialConfig).toHaveBeenCalledWith(serialOptions);
        });
    });

    describe('#executeAction', () => {
        test.each([
            ['SETCOLOR', ['255', '255', '255'], 'C'],
            ['KITT', ['255', '255', '255'], 'K'],
            ['PULSECOLOR', ['255', '255'], 'P'],
            ['RAINBOW', [], 'R'],
        ])(
            'should run correct method when running executeAction(%p, %p)',
            (action: string, parameters: string[], command: string) => {
                board.online = true;
                const spy = spyOn<any>(board, 'serialWriteBytes');

                board[properties.executeAction](action, parameters);

                expect(spy).toHaveBeenCalledWith(FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, [
                    '[',
                    command,
                    ...parameters.map(param => parseInt(param, 10)),
                    ']',
                ]);
            },
        );
    });

    describe('#pulseColor', () => {
        describe('happy flows', () => {
            test('should execute serialWriteBytes', () => {
                board[properties.serialWriteBytes] = jest.fn();

                board[properties.pulseColor](255, 255);

                expect(board[properties.serialWriteBytes]).toHaveBeenCalledWith(
                    FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0,
                    ['[', 'P', 255, 255, ']'],
                );
            });
        });

        describe('exception flows', () => {
            test.each([
                [0, 256],
                [-1, 255],
                ['a', 255],
                [128, 'z'],
            ])('should throw error when running pulseColor(%p, %p)', (hue: any, saturation: any) => {
                const pulseColorError = () => {
                    board[properties.pulseColor](hue, saturation);
                };

                expect(pulseColorError).toThrowError(new Error(`Parameters should be 8 bit numbers (0-255).`));
            });
        });
    });

    describe('#setColor', () => {
        describe('happy flows', () => {
            test('should execute serialWriteBytes', () => {
                board[properties.serialWriteBytes] = jest.fn();

                board[properties.setColor](255, 255, 255);

                expect(board[properties.serialWriteBytes]).toHaveBeenCalledWith(
                    FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0,
                    ['[', 'C', 255, 255, 255, ']'],
                );
            });
        });

        describe('exception flows', () => {
            test.each([
                [0, 256, 0],
                [-1, 255, 300],
                ['a', 255, -2],
                [128, 'z', 100],
            ])('should throw error when running setColor(%p, %p, %p)', (hue: any, saturation: any, value: any) => {
                const setColorError = () => {
                    board[properties.setColor](hue, saturation, value);
                };

                expect(setColorError).toThrowError(new Error(`Parameters should be 8 bit numbers (0-255).`));
            });
        });
    });

    describe('#kitt', () => {
        describe('happy flows', () => {
            test('should execute serialWriteBytes', () => {
                board[properties.serialWriteBytes] = jest.fn();

                board[properties.kitt](255, 255, 255);

                expect(board[properties.serialWriteBytes]).toHaveBeenCalledWith(
                    FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0,
                    ['[', 'K', 255, 255, 255, ']'],
                );
            });
        });

        describe('exception flows', () => {
            test.each([
                [0, 256, 0],
                [-1, 255, 300],
                ['a', 255, -2],
                [128, 'z', 100],
            ])('should throw error when running kitt(%p, %p, %p)', (hue: any, saturation: any, value: any) => {
                const kittError = () => {
                    board[properties.kitt](hue, saturation, value);
                };

                expect(kittError).toThrowError(new Error(`Parameters should be 8 bit numbers (0-255).`));
            });
        });
    });

    describe('#rainbow', () => {
        describe('happy flows', () => {
            test('should execute serialWriteBytes', () => {
                board[properties.serialWriteBytes] = jest.fn();

                board[properties.rainbow]();

                expect(board[properties.serialWriteBytes]).toHaveBeenCalledWith(
                    FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0,
                    ['[', 'R', ']'],
                );
            });
        });
    });

    describe('#parametersAreValid', () => {
        test.each([[[255, 128, 0]], [[0, 0, 0]], [[23, 86, 10]]])(
            'should return true when running parametersAreValid(%p)',
            (parameters: any[]) => {
                const result = LedController[properties.parametersAreValid](parameters);

                expect(result).toEqual(true);
            },
        );

        test.each([[[-1, 128, 0]], [[0, 256, 0]], [[23, 512, 10]], [[{}, 128, 10]], [[[], 128, 10]], [['a', 512, 10]]])(
            'should return false when running parametersAreValid(%p)',
            (parameters: any[]) => {
                const result = LedController[properties.parametersAreValid](parameters);

                expect(result).toEqual(false);
            },
        );
    });
});
