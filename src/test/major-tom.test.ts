import Board from '../domain/board';
import { Sequelize } from 'sequelize-typescript';
import LedController from '../domain/led-controller';
import FirmataBoardMock from './mocks/firmata-board.mock';
import * as FirmataBoard from 'firmata';

let board: any;
let sequelize: Sequelize;

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([Board]);
});

beforeEach(() => {
    board = new LedController();
});

describe('MajorTom:', () => {
    test('is instantiated', () => {
        expect(board).toBeDefined();
    });

    // todo: write more tests
    // deferring for now since MajorTom is not required for MVP
});
