import * as events from 'events';
import { WebSocketService } from './web-socket.service';
import { Response, IRequestResult } from '../domain/web-socket-message';
import { OK } from 'http-status-codes';
import { LoggerService } from './logger.service';
import {container} from "tsyringe";
import {BoardService} from "./board.service";
import {responseMock} from "../mocks/response.mock";

jest.mock('./logger.service');
jest.mock('./board.service');

let webSocketService: WebSocketService;
let boardServiceMock = new BoardService();

const privateProperties = {
    sendResponse: 'sendResponse',
    attachListeners: 'attachListeners',
    webSocketServer: 'webSocketServer',
    httpServer: 'httpServer',
    boardModel: 'boardModel',
    programModel: 'programModel',
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

beforeAll(() => {
    container.registerInstance(BoardService, boardServiceMock);
});

beforeEach(async () => {
    webSocketService = new WebSocketService();
});

afterEach(() => {
    if (webSocketService[privateProperties.webSocketServer] && webSocketService[privateProperties.httpServer]) {
        webSocketService.closeServer();
    }
});

describe('WebSocketService', () => {
    describe('constructor', () => {
        test('should be instantiated', () => {
            expect(webSocketService).toBeDefined();
        });
    });

    describe('#attachListeners', () => {
        test('should attach listeners to the boardModel', () => {
            jest.clearAllMocks();
            webSocketService[privateProperties.attachListeners]();

            expect(boardServiceMock.on).toHaveBeenCalledTimes(3);
        });
    });

    describe('#sendResponse', () => {
        test('should send a response to the client', () => {
            const client = {
                sendUTF: jest.fn(),
            };

            // @ts-ignore
            WebSocketService.sendResponse(client, responseMock);

            expect(client.sendUTF).toHaveBeenCalledWith(responseMock.toJSON());
        });
    });

    describe('#listen', () => {
        test('should create an http server and web socket server', () => {
            webSocketService.listen();
            expect(webSocketService[privateProperties.httpServer]).toBeDefined();
            expect(webSocketService[privateProperties.webSocketServer]).toBeDefined();

            expect(LoggerService.info).toHaveBeenCalled();
        });
    });

    describe('#closeServer', () => {
        test('should close the server', () => {
            webSocketService[privateProperties.webSocketServer] = {
                shutDown: jest.fn(),
            };
            webSocketService[privateProperties.httpServer] = {
                close: jest.fn(),
            };

            webSocketService.closeServer();

            expect(webSocketService[privateProperties.webSocketServer].shutDown).toHaveBeenCalled();
            expect(webSocketService[privateProperties.httpServer].close).toHaveBeenCalled();
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

            webSocketService[privateProperties.handleRequest] = jest.fn(() => Promise.resolve());
        });

        test('should send new client a list of existing boards', async () => {
            client.on = jest.fn();
            await webSocketService[privateProperties.handleConnectionRequest](request);
            // @ts-ignore
            expect(WebSocketService.sendResponse).toHaveBeenCalled();
            expect(client.on).toHaveBeenCalled();
        });

        test('should call handle request on new message from client', async () => {
            await webSocketService[privateProperties.handleConnectionRequest](request);
            client.emit('message', message);
            expect(webSocketService[privateProperties.handleRequest]).toHaveBeenCalledWith(message);
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

                webSocketService[privateProperties.handleProgramRequest] = jest.fn(() => Promise.resolve(result));
                webSocketService[privateProperties.handleBoardRequest] = jest.fn(() => Promise.resolve(result));
                webSocketService[privateProperties.handleCommandRequest] = jest.fn(() => Promise.resolve(result));
            });

            test.each([
                [{ type: 'utf8', utf8Data: '{"topic": "board", "body": {}}' }, 'handleBoardRequest'],
                [{ type: 'utf8', utf8Data: '{"topic": "command", "body": {}}' }, 'handleCommandRequest'],
                [{ type: 'utf8', utf8Data: '{"topic": "program", "body": {}}' }, 'handleProgramRequest'],
            ])('should call the appropriate handler method', async (_message: any, method: string) => {
                await webSocketService[privateProperties.handleRequest](_message);

                expect(webSocketService[method]).toHaveBeenCalledWith(JSON.parse(_message.utf8Data).body);
            });

            test('should return a web socket response when resolved', async () => {
                const message = {
                    type: 'utf8',
                    utf8Data: '{"topic": "board", "body": { "action": "get", "boardId": "test" }}',
                };
                const responseObject = await webSocketService[privateProperties.handleRequest](message);

                expect(responseObject.constructor.name).toEqual('Response');
            });
        });

        describe('exception flows', () => {
            test('should return a bad request', async () => {
                const message = {};

                try {
                    await webSocketService[privateProperties.handleRequest](message);
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

                webSocketService[privateProperties.handleBoardRequest] = jest.fn(() => Promise.reject(error));

                try {
                    await webSocketService[privateProperties.handleRequest](message);
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
