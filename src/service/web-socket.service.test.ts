import { Sequelize } from 'sequelize-typescript';
import ProgramsMock from '../mocks/programs.mock';
import * as events from 'events';
import { WebSocketService } from './web-socket.service';
import { BoardServiceMock } from '../mocks/board.service.mock';
import { BoardResponseBody, Response, MESSAGE_TOPIC, IRequestResult } from '../domain/web-socket-message';
import { DatabaseService } from './database.service';
import { OK } from 'http-status-codes';
import { Program } from '../domain/program/base';

let webSocketService: any;

const options = {
    port: 3001,
    boardModel: new BoardServiceMock(),
    programModel: new ProgramsMock(),
};

let sequelize: Sequelize;
let databaseService: any;
let response: Response;

console.info = () => {};

const databaseOptions = {
    schema: 'rev',
    host: 'localhost',
    port: 3306,
    username: '',
    password: '',
    dialect: 'sqlite',
    path: ':memory:',
    debug: false,
};

beforeEach(async () => {
    // @ts-ignore
    webSocketService = new WebSocketService(options);

    response = new Response(MESSAGE_TOPIC.BOARD, '1234', OK, new BoardResponseBody({ boards: [] }));

    databaseService = new DatabaseService();
    await databaseService.synchronise();
});

beforeAll(() => {
    // @ts-ignore
    WebSocketService.log.info = jest.fn();
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    sequelize.addModels([Program]);
});

// afterEach(async() => {
//     webSocketService.closeServer();
// });

describe('WebSocketService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(webSocketService).toBeDefined();
        });
    });

    describe('#attachListeners', () => {
        test('should attach listeners to the boardModel', () => {
            jest.clearAllMocks();
            webSocketService.attachListeners();

            expect(options.boardModel.on).toHaveBeenCalledTimes(3);
        });
    });

    describe('#sendResponse', () => {
        test('should send a response to the client', () => {
            const client = {
                sendUTF: jest.fn(),
            };

            // @ts-ignore
            WebSocketService.sendResponse(client, response);

            expect(client.sendUTF).toHaveBeenCalledWith(response.toJSON());
        });
    });

    describe('#startServer', () => {
        test('should create an http server and web socket server', () => {
            webSocketService.startServer();
            expect(webSocketService.httpServer).toBeDefined();
            expect(webSocketService.webSocketServer).toBeDefined();

            // @ts-ignore
            expect(WebSocketService.log.info).toHaveBeenCalled();
        });
    });

    describe('#closeServer', () => {
        test('should close the server', () => {
            webSocketService.webSocketServer = {
                shutDown: jest.fn(),
            };
            webSocketService.httpServer = {
                close: jest.fn(),
            };

            webSocketService.closeServer();

            expect(webSocketService.webSocketServer.shutDown).toHaveBeenCalled();
            expect(webSocketService.httpServer.close).toHaveBeenCalled();
        });
    });

    describe('#handleConnectionRequest', () => {
        let client, request, message;

        beforeAll(() => {
            // @ts-ignore
            WebSocketService.sendResponse = jest.fn();
        });

        beforeEach(() => {
            client = new events.EventEmitter();

            request = {
                accept: (a, b, c) => {
                    return client;
                },
            };

            message = { type: 'utf8', utf8Data: '{"test": "test"}' };

            webSocketService.handleRequest = jest.fn(() => Promise.resolve());
        });

        test('should send new client a list of existing boards', async () => {
            client.on = jest.fn();
            await webSocketService.handleConnectionRequest(request);
            // @ts-ignore
            expect(WebSocketService.sendResponse).toHaveBeenCalled();
            expect(client.on).toHaveBeenCalled();
        });

        test('should call handle request on new message from client', async () => {
            await webSocketService.handleConnectionRequest(request);
            client.emit('message', message);
            expect(webSocketService.handleRequest).toHaveBeenCalledWith(message);
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

                webSocketService.handleProgramRequest = jest.fn(() => Promise.resolve(result));
                webSocketService.handleBoardRequest = jest.fn(() => Promise.resolve(result));
                webSocketService.handleCommandRequest = jest.fn(() => Promise.resolve(result));
            });

            test.each([
                [{ type: 'utf8', utf8Data: '{"topic": "board", "body": {}}' }, 'handleBoardRequest'],
                [{ type: 'utf8', utf8Data: '{"topic": "command", "body": {}}' }, 'handleCommandRequest'],
                [{ type: 'utf8', utf8Data: '{"topic": "program", "body": {}}' }, 'handleProgramRequest'],
            ])('should call the appropriate handler method', async (_message: any, method: string) => {
                await webSocketService.handleRequest(_message);

                expect(webSocketService[method]).toHaveBeenCalledWith(JSON.parse(_message.utf8Data).body);
            });

            test('should return a web socket response when resolved', async () => {
                const message = {
                    type: 'utf8',
                    utf8Data: '{"topic": "board", "body": { "action": "get", "boardId": "test" }}',
                };
                const responseObject = await webSocketService.handleRequest(message);

                expect(responseObject.constructor.name).toEqual('Response');
            });
        });

        describe('exception flows', () => {
            test('should return a bad request', async () => {
                const message = {};

                try {
                    await webSocketService.handleRequest(message);
                } catch (error) {
                    expect(error).toEqual(new Error('Message in unsupported format.'));
                }
            });

            test('should return a bad request', async () => {
                const message = {
                    type: 'utf8',
                    utf8Data: '{"topic": "board"}',
                };

                const error = new Error('beep');

                webSocketService.handleBoardRequest = jest.fn(() => Promise.reject(error));

                try {
                    await webSocketService.handleRequest(message);
                } catch (error) {
                    expect(error).toEqual(error);
                }
            });
        });
    });

    // describe('#handleProgramRequest', () => {
    //     test('should execute program on board', () => {
    //         const requestBody = new ProgramRequestBody({
    //             action: PROGRAM_REQUEST_ACTION.EXEC,
    //             programId: '1',
    //             boardId: '1',
    //             repeat: 2
    //         });
    //
    //
    //         webSocketService.handleProgramRequest();
    //     });
    // });
    //
    // describe('#handleCommandRequest', () => {
    //     test('', () => {
    //
    //     });
    // });
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
