import * as WebSocket from 'websocket';
import { createServer, Server } from 'http';
import LoggerService from './logger.service';
import BoardsModel from '../model/boards.model';
import Chalk from 'chalk';
import ICommand from '../domain/interface/command.interface';
import BoardRequestBody from '../domain/web-socket-message/body/board-request-body';
import BoardResponseBody from '../domain/web-socket-message/body/board-response-body';
import { RESPONSE_CODE } from '../domain/enum/response-code.enum';
import CommandRequestBody from '../domain/web-socket-message/body/command-request-body';
import ProgramResponseBody from '../domain/web-socket-message/body/program-response-body';
import ProgramRequestBody from '../domain/web-socket-message/body/program-request-body';
import ProgramsModel from '../model/programs.model';
import BroadcastBody from '../domain/web-socket-message/body/broadcast-body';
import IBoard from '../domain/interface/board';
import IWebSocketOptions from '../domain/interface/web-socket-options';
import Program from '../domain/program';
import WebSocketResponse from '../domain/web-socket-message/web-socket-response';
import { MESSAGE_TOPIC } from '../domain/enum/message-topic.enum';
import WebSocketRequest from '../domain/web-socket-message/web-socket-request';
import IRequestResult from '../domain/interface/request-result.interface';
import { PROGRAM_REQUEST_ACTION } from '../domain/enum/program-request-action.enum';
import { BOARD_REQUEST_ACTION } from '../domain/enum/board-request-action.enum';
import { BROADCAST_ACTION } from '../domain/enum/broadcast-action.enum';
import WebSocketBroadcast from '../domain/web-socket-message/web-socket-broadcast';
import { BadRequest } from '../error/errors';

/**
 * @description Service that allows clients to interface using a near real-time web socket connection
 * @namespace WebSocketService
 */
class WebSocketService {
    private static namespace = `web-socket`;
    private static log = new LoggerService(WebSocketService.namespace);
    private webSocketServer: WebSocket.server;
    private httpServer: Server;
    private boardModel: BoardsModel;
    private programModel: ProgramsModel;

    constructor(options: IWebSocketOptions) {
        this.boardModel = options.boardModel;
        this.programModel = options.programModel;

        this.boardModel.on('connected', this.broadcastBoardConnected);
        this.boardModel.on('update', this.broadcastBoardUpdated);
        this.boardModel.on('disconnected', this.broadcastBoardDisconnected);

        this.startServer(options.port);
    }

    /**
     * Send a response message to a specific client.
     */
    private static sendResponse(client: WebSocket.connection, response: WebSocketResponse): void {
        client.sendUTF(response.toJSON());
    }

    /**
     * Start the WebSocket server
     */
    private startServer(port: number): void {
        this.httpServer = createServer().listen(port);
        this.webSocketServer = new WebSocket.server({
            httpServer: this.httpServer,
        });

        WebSocketService.log.info(`Listening on port ${Chalk.rgb(240, 240, 30).bold(JSON.stringify(port))}.`);
        this.webSocketServer.on('request', this.handleConnectionRequest);
    }

    public closeServer(): void {
        this.webSocketServer.shutDown();
        this.httpServer.close();
    }

    /**
     * Handles new WebSocket connection requests.
     */
    private handleConnectionRequest = async (request: WebSocket.request): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let client = request.accept(undefined, request.origin);

            const response = await this.handleClientConnected();
            WebSocketService.sendResponse(client, response);

            client.on('message', async (message: { type: string; utf8Data: any }) => {
                WebSocketService.sendResponse(client, await this.handleRequest(message));
            });

            client.on('close', () => {
                client = undefined;
            });

            resolve();
        });
    };

    /**
     * Handles received WebSocket requests and routes it to the corresponding method to construct the response.
     */
    private handleRequest = async (message: WebSocket.IMessage): Promise<WebSocketResponse> => {
        return new Promise(async (resolve, reject) => {
            if (message.type !== 'utf8') {
                WebSocketService.log.warn('Message received in wrong encoding format. Supported format is utf8');
            }

            const request = WebSocketRequest.fromJSON(message.utf8Data);
            let result: IRequestResult = {
                responseCode: undefined,
                responseBody: undefined,
            };

            try {
                switch (request.topic) {
                    case MESSAGE_TOPIC.PROGRAM:
                        result = await this.handleProgramRequest(request.body);
                        break;
                    case MESSAGE_TOPIC.BOARD:
                        result = await this.handleBoardRequest(request.body);
                        break;
                    case MESSAGE_TOPIC.COMMAND:
                        result = await this.handleCommandRequest(request.body);
                }
            } catch (error) {
                result.responseCode = error.code;
                result.responseBody = { message: error.message };
            }

            resolve(new WebSocketResponse(request.topic, request.id, result.responseCode, result.responseBody));
        });
    };

    /**
     * Process a {@link ProgramRequestBody} and return an object containing a body property of type {@link IProgramResponse} and a code property of type {@link ResponseCodeEnum}.
     * If the requested action did not produce a body, the returned type of body is undefined.
     */
    private handleProgramRequest(body: ProgramRequestBody): Promise<IRequestResult> {
        return new Promise(async (resolve, reject) => {
            const result: IRequestResult = {
                responseCode: undefined,
                responseBody: undefined,
            };
            let program: Program;

            try {
                switch (body.action) {
                    case PROGRAM_REQUEST_ACTION.EXEC:
                        // execute program
                        program = this.programModel.getProgramById(body.programId);

                        await this.boardModel.executeProgramOnBoard(body.boardId, program, body.repeat);

                        result.responseCode = RESPONSE_CODE.NO_CONTENT;
                        break;

                    case PROGRAM_REQUEST_ACTION.HALT:
                        // stop program execution
                        this.boardModel.stopProgram(body.boardId);
                        result.responseCode = RESPONSE_CODE.NO_CONTENT;
                        break;

                    case PROGRAM_REQUEST_ACTION.GET:
                        const programs: Program[] = [];
                        // body program(s)
                        if (body.programId) {
                            // by id
                            programs.push(this.programModel.getProgramById(body.programId));
                        } else {
                            // all programs
                            programs.push(...this.programModel.getAllPrograms());
                        }

                        result.responseBody = new ProgramResponseBody({ programs });
                        result.responseCode = RESPONSE_CODE.OK;
                        break;

                    case PROGRAM_REQUEST_ACTION.POST:
                        // add a new program
                        program = ProgramsModel.createProgram(body.program);
                        const id = await this.programModel.addProgram(program);

                        result.responseBody = new ProgramResponseBody({ programId: id });
                        result.responseCode = RESPONSE_CODE.CREATED;

                        break;

                    case PROGRAM_REQUEST_ACTION.PUT:
                        // update existing program
                        await this.programModel.updateProgram(body.program);

                        result.responseCode = RESPONSE_CODE.NO_CONTENT;

                        break;

                    case PROGRAM_REQUEST_ACTION.DELETE:
                        // remove existing program
                        await this.programModel.deleteProgram(body.programId);

                        result.responseCode = RESPONSE_CODE.NO_CONTENT;

                        break;

                    default:
                        // action missing from body
                        reject(
                            new BadRequest(
                                `Body property 'action' missing or invalid. Valid actions are: ${Object.values(
                                    PROGRAM_REQUEST_ACTION,
                                )}. Received: ${body.action}.`,
                            ),
                        );
                }

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Process a {@link CommandRequestBody} and return an object containing a code property of type {@link ResponseCodeEnum}.
     */
    private handleCommandRequest(body: CommandRequestBody): Promise<IRequestResult> {
        return new Promise(async (resolve, reject) => {
            const result: IRequestResult = {
                responseCode: undefined,
                responseBody: undefined,
            };

            try {
                const board = this.boardModel.getDiscreteBoardById(body.boardId);
                const command: ICommand = { action: body.action, parameters: body.parameters };

                await this.boardModel.executeActionOnBoard(board.id, command);
                result.responseCode = RESPONSE_CODE.NO_CONTENT;

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Process a {@link ProgramRequestBody} and return an object containing a body property of type {@link IBoardResponse} and a code property of type {@link ResponseCodeEnum}.
     * If the requested action did not produce a body, the returned type of body is undefined.
     */
    private handleBoardRequest(body: BoardRequestBody): Promise<IRequestResult> {
        return new Promise(async (resolve, reject) => {
            const result: IRequestResult = {
                responseCode: undefined,
                responseBody: undefined,
            };

            try {
                switch (body.action) {
                    case BOARD_REQUEST_ACTION.GET:
                        const boards = [];
                        if (body.boardId) {
                            // body single board
                            boards.push(this.boardModel.getDiscreteBoardById(body.boardId));
                        } else {
                            // body all boards
                            boards.push(...this.boardModel.getAllBoards());
                        }

                        result.responseBody = new BoardResponseBody({ boards });
                        result.responseCode = RESPONSE_CODE.OK;

                        break;
                    case BOARD_REQUEST_ACTION.PUT:
                        await this.boardModel.updateBoard(body.board);
                        result.responseCode = RESPONSE_CODE.NO_CONTENT;
                        break;
                    case BOARD_REQUEST_ACTION.DELETE:
                        // todo: implement
                        break;
                    default:
                        reject(
                            new BadRequest(
                                `Body property 'action' missing or invalid. Valid actions are: ${Object.values(
                                    BOARD_REQUEST_ACTION,
                                )}. Received: ${body.action}.`,
                            ),
                        );
                }

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Send newly connected client a list of all known boards (online or not).
     */
    private handleClientConnected(): Promise<WebSocketResponse> {
        return new Promise(resolve => {
            const body = new BoardResponseBody({
                boards: this.boardModel.getAllBoards(),
            });

            resolve(new WebSocketResponse(MESSAGE_TOPIC.BOARD, undefined, undefined, body));
        });
    }

    /**
     * Broadcast an update with the newly connected board to connected clients.
     */
    private broadcastBoardConnected = (board: IBoard, newRecord: boolean): void => {
        this.broadcastBoardUpdate(newRecord ? BROADCAST_ACTION.NEW : BROADCAST_ACTION.UPDATE, board);
    };

    /**
     * Broadcast the updated board to all connected clients.
     */
    private broadcastBoardUpdated = (board: IBoard): void => {
        this.broadcastBoardUpdate(BROADCAST_ACTION.UPDATE, board);
    };

    /**
     * Broadcast an update with the disconnected board to connected clients.
     */
    private broadcastBoardDisconnected = (board: IBoard): void => {
        this.broadcastBoardUpdate(BROADCAST_ACTION.UPDATE, board);
    };

    /**
     * Broadcast a board property or status update.
     */
    private broadcastBoardUpdate = (action: BROADCAST_ACTION, board: IBoard): void => {
        const body: BroadcastBody = {
            action,
            payload: [board],
        };

        const message = new WebSocketBroadcast(MESSAGE_TOPIC.BOARD, body);

        this.broadcast(message);
    };

    /**
     * Broadcast a message to all connected clients.
     */
    private broadcast(message: WebSocketBroadcast): void {
        this.webSocketServer.broadcastUTF(message.toJSON());
    }
}

export default WebSocketService;
