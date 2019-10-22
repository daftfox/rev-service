import Program from '../domain/program';
import { Sequelize } from 'sequelize-typescript';
import ICommand from "../interface/command";

let program: any;
let sequelize: Sequelize;

const mockCommands: ICommand[] = [
    {
        action: 'TOGGLELED',
        duration: 1000,
    },{
        action: 'TOGGLELED',
        duration: 1000,
    },{
        action: 'TOGGLELED',
        duration: 1000,
    },
];

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([
        Program,
    ]);
});

beforeEach(() => {
    program = new Program();
});

describe('Program:', () => {
    test('is instantiated', () => {
        expect(program).toBeDefined();
    });

    test('sets commands', () => {
        program.setCommands( mockCommands );

        expect( typeof program.commands ).toEqual('string');
        expect( program.commands ).toEqual( JSON.stringify( mockCommands ) );
    });

    test('gets commands', () => {
        program.setCommands( mockCommands );

        const retrievedCommands = program.getCommands();

        expect( Array.isArray( retrievedCommands ) ).toBeTruthy();
        expect( retrievedCommands[0] ).toHaveProperty( 'action' );
        expect( retrievedCommands[0] ).toHaveProperty( 'duration' );
    });
});