import * as events from 'events';
import { WebSocketService } from './web-socket.service';
import {
    BoardResponseBody,
    CommandRequestBody,
    IRequestResult,
    MESSAGE_TOPIC,
    PROGRAM_REQUEST_ACTION,
    ProgramRequestBody,
    ProgramResponseBody,
    Response,
} from '../domain/web-socket-message';
import { CREATED, NO_CONTENT, OK } from 'http-status-codes';
import { LoggerService } from './logger.service';
import { ProgramService } from './program.service';

jest.mock('./logger.service');
jest.mock('./board.service');
jest.mock('./program.service');
jest.mock('./configuration.service');

let service: WebSocketService;
const responseMock = new Response(MESSAGE_TOPIC.BOARD, '1234', OK, new BoardResponseBody({ boards: [] }));

const properties = {
    sendResponse: 'sendResponse',
    attachListeners: 'attachListeners',
    webSocketServer: 'webSocketServer',
    httpServer: 'httpServer',
    boardService: 'boardService',
    programService: 'programService',
    handleRequest: 'handleRequest',
    handleConnectionRequest: 'handleConnectionRequest',
    broadcastBoardUpdated: 'broadcastBoardUpdated',
    broadcastBoardDisconnected: 'broadcastBoardDisconnected',
    broadcastBoardUpdate: 'broadcastBoardUpdate',
    broadcast: 'broadcast',
    handleClientConnected: 'handleClientConnected',
    handleBoardRequest: 'handleBoardRequest',
    handleCommandRequest: 'handleCommandRequest',
    handleProgramRequest: 'handleProgramRequest',
};

beforeEach(async () => {
    service = new WebSocketService();
});

afterEach(() => {
    if (service[properties.webSocketServer] && service[properties.httpServer]) {
        service.closeServer();
    }
});

describe('WebSocketService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(service).toBeDefined();
        });
    });

    describe('#attachListeners', () => {
        test('should attach listeners to the boardService', () => {
            const spy = spyOn(service[properties.boardService].event, 'attach');
            service[properties.attachListeners]();

            expect(spy).toHaveBeenCalledTimes(3);
        });
    });

    describe('#sendResponse', () => {
        test('should send a response to the client', () => {
            const client = {
                sendUTF: jest.fn(),
            };

            WebSocketService[properties.sendResponse](client, responseMock);

            expect(client.sendUTF).toHaveBeenCalledWith(responseMock.toJSON());
        });
    });

    describe('#listen', () => {
        test('should create an http server and web socket server', () => {
            service.listen();
            expect(service[properties.httpServer]).toBeDefined();
            expect(service[properties.webSocketServer]).toBeDefined();

            expect(LoggerService.info).toHaveBeenCalled();
        });
    });

    describe('#closeServer', () => {
        test('should close the server', () => {
            service[properties.webSocketServer] = {
                shutDown: jest.fn(),
            };
            service[properties.httpServer] = {
                close: jest.fn(),
            };

            service.closeServer();

            expect(service[properties.webSocketServer].shutDown).toHaveBeenCalled();
            expect(service[properties.httpServer].close).toHaveBeenCalled();
        });
    });

    describe('#handleConnectionRequest', () => {
        let client, request, message, spySendResponse;

        beforeAll(() => {
            spySendResponse = spyOn<any>(WebSocketService, 'sendResponse');
        });

        beforeEach(() => {
            client = new events.EventEmitter();

            request = {
                accept: (a, b, c) => {
                    return client;
                },
            };

            message = { type: 'utf8', utf8Data: '{"test": "test"}' };

            spyOn<any>(service, 'handleRequest').and.returnValue(Promise.resolve());
        });

        test('should send new client a list of existing boards', async () => {
            client.on = jest.fn();
            await service[properties.handleConnectionRequest](request);
            expect(spySendResponse).toHaveBeenCalled();
            expect(client.on).toHaveBeenCalled();
        });

        test('should call handle request on new message from client', async () => {
            await service[properties.handleConnectionRequest](request);
            client.emit('message', message);
            expect(service[properties.handleRequest]).toHaveBeenCalledWith(message);
        });
    });

    describe('#handleRequest', () => {
        describe('happy flows', () => {
            let result: IRequestResult;

            beforeEach(() => {
                result = {
                    responseCode: OK,
                    responseBody: { boards: [] },
                };

                spyOn<any>(service, 'handleProgramRequest').and.returnValue(Promise.resolve(result));
                spyOn<any>(service, 'handleBoardRequest').and.returnValue(Promise.resolve(result));
                spyOn<any>(service, 'handleCommandRequest').and.returnValue(Promise.resolve(result));
            });

            test.each([
                [{ type: 'utf8', utf8Data: '{"topic": "board", "body": {}}' }, 'handleBoardRequest'],
                [{ type: 'utf8', utf8Data: '{"topic": "command", "body": {}}' }, 'handleCommandRequest'],
                [{ type: 'utf8', utf8Data: '{"topic": "program", "body": {}}' }, 'handleProgramRequest'],
            ])('should call the appropriate handler method', async (_message: any, method: string) => {
                await service[properties.handleRequest](_message);

                expect(service[method]).toHaveBeenCalledWith(JSON.parse(_message.utf8Data).body);
            });

            test('should return a web socket response when resolved', async () => {
                const message = {
                    type: 'utf8',
                    utf8Data: '{"topic": "board", "body": { "action": "get", "boardId": "test" }}',
                };
                const responseObject = await service[properties.handleRequest](message);

                expect(responseObject.constructor).toEqual(Response);
            });
        });

        describe('exception flows', () => {
            test('should return a bad request', async () => {
                const message = {};
                const error = new Error('Message in unsupported format.');

                try {
                    await service[properties.handleRequest](message);
                } catch (error) {
                    expect(error).toEqual(error);
                }
            });

            test('should return a bad request', async () => {
                const message = {
                    type: 'utf8',
                    utf8Data: '{"topic": "board"}',
                };

                const error = new Error('beep');
                spyOn<any>(service, 'handleBoardRequest').and.returnValue(Promise.reject(error));

                try {
                    await service[properties.handleRequest](message);
                } catch (error) {
                    expect(error).toEqual(error);
                }
            });
        });
    });

    describe('#handleProgramRequest', () => {
        const program = {
            id: '1',
            name: 'test',
            deviceType: 'all',
        };
        const requestBody = new ProgramRequestBody({
            action: undefined,
            programId: '1',
            boardId: '1',
            repeat: 2,
            program,
        });

        test('should execute program on board', async () => {
            requestBody.action = PROGRAM_REQUEST_ACTION.EXEC;
            const expected = {
                responseCode: NO_CONTENT,
                responseBody: undefined,
            };

            spyOn(service[properties.programService], 'getProgramById').and.returnValue(program);
            const spy = spyOn(service[properties.programService], 'executeProgramOnBoard').and.returnValue(
                Promise.resolve(),
            );

            const result = await service[properties.handleProgramRequest](requestBody);

            expect(spy).toHaveBeenCalledWith(requestBody.boardId, program, requestBody.repeat);
            expect(result).toEqual(expected);
        });

        test('should halt execution of program on board', async () => {
            requestBody.action = PROGRAM_REQUEST_ACTION.HALT;
            const expected = {
                responseCode: NO_CONTENT,
                responseBody: undefined,
            };

            const spy = spyOn(service[properties.programService], 'stopProgram');
            const result = await service[properties.handleProgramRequest](requestBody);

            expect(spy).toHaveBeenCalledWith(requestBody.boardId);
            expect(result).toEqual(expected);
        });

        test('should return a specific program', async () => {
            requestBody.action = PROGRAM_REQUEST_ACTION.GET;
            const expected = {
                responseCode: OK,
                responseBody: new ProgramResponseBody({ programs: [program] }),
            };

            const spy = spyOn(service[properties.programService], 'getProgramById').and.returnValue(program);
            const result = await service[properties.handleProgramRequest](requestBody);

            expect(spy).toHaveBeenCalledWith(requestBody.boardId);
            expect(result).toEqual(expected);
        });

        test('should return all programs', async () => {
            requestBody.programId = undefined;
            requestBody.action = PROGRAM_REQUEST_ACTION.GET;

            const expected = {
                responseCode: OK,
                responseBody: new ProgramResponseBody({ programs: [program] }),
            };

            const spy = spyOn(service[properties.programService], 'getAllPrograms').and.returnValue([program]);
            const result = await service[properties.handleProgramRequest](requestBody);

            expect(spy).toHaveBeenCalled();
            expect(result).toEqual(expected);
        });

        test('should add a new program to the system', async () => {
            requestBody.action = PROGRAM_REQUEST_ACTION.POST;

            const expected = {
                responseCode: CREATED,
                responseBody: new ProgramResponseBody({ programId: program.id }),
            };

            const spyCreate = spyOn(ProgramService, 'createProgram').and.returnValue(program);
            const spyAdd = spyOn(service[properties.programService], 'addProgram').and.returnValue(
                Promise.resolve(program.id),
            );
            const result = await service[properties.handleProgramRequest](requestBody);

            expect(spyCreate).toHaveBeenCalledWith(program);
            expect(spyAdd).toHaveBeenCalledWith(program);
            expect(result).toEqual(expected);
        });

        test('should update an existing program', async () => {
            requestBody.action = PROGRAM_REQUEST_ACTION.PUT;

            const expected = {
                responseCode: NO_CONTENT,
                responseBody: undefined,
            };

            const spyUpdate = spyOn(service[properties.programService], 'updateProgram').and.returnValue(
                Promise.resolve(),
            );
            const result = await service[properties.handleProgramRequest](requestBody);

            expect(spyUpdate).toHaveBeenCalledWith(program);
            expect(result).toEqual(expected);
        });

        test('should delete an existing program', async () => {
            requestBody.action = PROGRAM_REQUEST_ACTION.DELETE;
            requestBody.programId = program.id;

            const expected = {
                responseCode: NO_CONTENT,
                responseBody: undefined,
            };

            const spyDelete = spyOn(service[properties.programService], 'deleteProgram').and.returnValue(
                Promise.resolve(),
            );
            const result = await service[properties.handleProgramRequest](requestBody);

            expect(spyDelete).toHaveBeenCalledWith(program.id);
            expect(result).toEqual(expected);
        });
    });

    describe('#handleCommandRequest', () => {
        const board = {
            id: '1',
        };
        const request = new CommandRequestBody({ boardId: board.id, action: 'TOGGLELED' });

        test('should execute the command', async () => {
            const expected = {
                responseCode: NO_CONTENT,
                responseBody: undefined,
            };
            const command = {
                action: request.action,
                parameters: undefined,
            };

            const spy = spyOn(service[properties.programService], 'executeCommandOnBoard').and.returnValue(
                Promise.resolve(),
            );

            const result = await service[properties.handleCommandRequest](request);

            expect(spy).toHaveBeenCalledWith(request.boardId, command);
            expect(result).toEqual(expected);
        });
    });
    //
    // describe('#handleBoardRequest', () => {
    //
    // });
    //
    // describe('#handleClientConnected', () => {
    //     test('', () => {
    //
    //     });
    // });
    //
    // describe('#broadcastBoardConnected', () => {
    //     test('', () => {
    //
    //     });
    // });
    //
    // describe('#broadcastBoardUpdated', () => {
    //     test('', () => {
    //
    //     });
    // });
    //
    // describe('#broadcastBoardDisconnected', () => {
    //     test('', () => {
    //
    //     });
    // });
    //
    // describe('#broadcastBoardUpdate', () => {
    //     test('', () => {
    //
    //     });
    // });
    //
    // describe('#broadcast', () => {
    //     test('', () => {
    //
    //     });
    // });
});
