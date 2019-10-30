import Board from '../domain/board';
import {Sequelize} from 'sequelize-typescript';
import LedController from "../domain/led-controller";
import FirmataBoardMock from "./mocks/firmata-board.mock";
import * as FirmataBoard from 'firmata';

let board: any;
let sequelize: Sequelize;

const actions = [
    {
        name: 'SETCOLOR',
        command: 'C',
        parameters: [ 255, 255, 255 ],
    },{
        name: 'KITT',
        command: 'K',
        parameters: [ 255, 255, 255 ],
    },{
        name: 'PULSECOLOR',
        command: 'P',
        parameters: [ 255, 255 ],
    },{
        name: 'RAINBOW',
        command: 'R',
        parameters: [],
    },
];

beforeAll(() => {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([
        Board,
    ]);
});

beforeEach(() => {
    board = new LedController(null, null, null, null, 'bacon');
});

describe('LedController:', () => {
    test('is instantiated', () => {
        expect(board).toBeDefined();
    });

    test('is instantiated with firmataBoard', () => {
        // @ts-ignore
        const firmataBoardMock = new FirmataBoardMock() as FirmataBoard;
        board = new LedController(undefined, undefined, firmataBoardMock , undefined, 'bacon' );

        expect(board).toBeDefined();
    });

    test('.executeAction() executes all available actions correctly', () => {
        const mockFirmataBoard = new FirmataBoardMock();
        board.firmataBoard = mockFirmataBoard;
        board.online = true;
        board.serialWriteBytes = jest.fn();

        actions.forEach( action => {
            board.executeAction(action.name, action.parameters);

            expect( board.serialWriteBytes ).toHaveBeenCalledWith(FirmataBoard.SERIAL_PORT_ID.SW_SERIAL0, ["[", action.command, ...action.parameters, "]"]);
        } );
    });

    test('', () => {

    });
});