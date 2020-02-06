import * as events from 'events';

export const program = {
    name: 'testProgram',
    deviceType: 'all',
    id: 'test',
    commands: [
        {
            action: 'TOGGLELED',
        },
    ],
};

export default class ProgramsMock extends events.EventEmitter {
    createProgram = jest.fn();
    addProgram = jest.fn(() => Promise.resolve());
    deleteProgram = jest.fn(() => Promise.resolve());
    getProgramById = jest.fn();
    getAllPrograms = jest.fn();
    updateProgram = jest.fn(() => Promise.resolve());
}
