import { Sequelize } from 'sequelize-typescript';
import { ICommand } from '../interface';
import { Program } from './program.model';

let program: any;
let sequelize: Sequelize;

const mockCommands: ICommand[] = [
    {
        action: 'TOGGLELED',
        duration: 1000,
    },
    {
        action: 'TOGGLELED',
        duration: 1000,
    },
    {
        action: 'TOGGLELED',
        duration: 1000,
    },
];

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([Program]);
});

beforeEach(() => {
    program = new Program();
});

describe('Program:', () => {
    describe('constructor', () => {
        test('is instantiated', () => {
            expect(program).toBeDefined();
        });
    });
});
