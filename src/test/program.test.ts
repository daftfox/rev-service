import Program from '../domain/program';
import { Sequelize } from 'sequelize-typescript';
import ICommand from "../domain/interface/command";

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
    describe('constructor', () => {
        test('is instantiated', () => {
            expect(program).toBeDefined();
        });
    });

    describe('setCommands', () => {
        test('should parse and set commands', () => {
            program.setCommands( mockCommands );

            expect( typeof program.commands ).toEqual('string');
            expect( program.commands ).toEqual( JSON.stringify( mockCommands ) );
        });
    });

    describe('getCommands', () => {
        test('should return array of commands', () => {
            program.setCommands( mockCommands );

            const retrievedCommands = program.getCommands();

            expect( Array.isArray( retrievedCommands ) ).toBeTruthy();
            expect( retrievedCommands[0] ).toHaveProperty( 'action' );
            expect( retrievedCommands[0] ).toHaveProperty( 'duration' );
        });
    });
});

// describe('SOS Program', () => {
//     describe('', () => {
//         test('', () => [
//
//         ]);
//     });
// });