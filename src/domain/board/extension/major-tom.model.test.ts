import { Sequelize } from 'sequelize-typescript';
import { Board } from '../base';
import { LedController } from './led-controller.model';

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
