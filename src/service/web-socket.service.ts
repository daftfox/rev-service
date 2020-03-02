import * as WebSocket from 'websocket';
import { createServer, Server } from 'http';
import { LoggerService } from './logger.service';
import { BoardService } from './board.service';
import { Program, ICommand } from '../domain/program';
import { ProgramService } from './program.service';
import { IBoard } from '../domain/board';
import {
    Response,
    Request,
    ProgramRequestBody,
    ProgramResponseBody,
    CommandRequestBody,
    BoardRequestBody,
    BoardResponseBody,
    BroadcastBody,
    Broadcast,
    MESSAGE_TOPIC,
    PROGRAM_REQUEST_ACTION,
    BOARD_REQUEST_ACTION,
    BROADCAST_ACTION,
    IRequestResult,
} from '../domain/web-socket-message';
import { BAD_REQUEST, CREATED, NO_CONTENT, OK } from 'http-status-codes';
import { container, singleton } from 'tsyringe';
import { ConfigurationService } from './configuration.service';
import { BoardConnectedEvent, BoardDisconnectedEvent, BoardUpdatedEvent, Event } from '../domain/event/base';
import { matchBoardConnectedEvent, matchBoardDisonnectedEvent, matchBoardUpdatedEvent } from '../domain/event/matcher';

/**
 * @description Service that allows clients to interface using a near real-time web socket connection
 * @namespace WebSocketService
 */
@singleton()
export class WebSocketService {
    private namespace = `web-socket`;
    private webSocketServer: WebSocket.server;
    private httpServer: Server;
    private boardService: BoardService;
    private programService: ProgramService;
    readonly port: number;

    constructor() {
        this.port = container.resolve(ConfigurationService).webSocketPort;
        this.boardService = container.resolve(BoardService);
        this.programService = container.resolve(ProgramService);

        this.attachListeners();
    }

    /**
     * Send a response message to a specific client.
     */
    private static sendResponse(client: WebSocket.connection, response: Response): void {
        client.sendUTF(response.toJSON());
    }

    private attachListeners(): void {
        this.boardService.event.attach(matchBoardUpdatedEvent, this.broadcastBoardUpdated);

        this.boardService.event.attach(matchBoardConnectedEvent, this.broadcastBoardConnected);

        this.boardService.event.attach(matchBoardDisonnectedEvent, this.broadcastBoardDisconnected);
    }

    /**
     * Start the WebSocket server
     */
    public listen(): void {
        this.httpServer = createServer().listen(this.port);
        this.webSocketServer = new WebSocket.server({
            httpServer: this.httpServer,
        });

        LoggerService.info(
            `Listening on port ${LoggerService.highlight(this.port.toString(10), 'yellow', true)}.`,
            this.namespace,
        );
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
            const client = request.accept(undefined, request.origin);

            const response = await this.handleClientConnected();
            WebSocketService.sendResponse(client, response);

            client.on('message', async (message: { type: string; utf8Data: any }) => {
                WebSocketService.sendResponse(client, await this.handleRequest(message));
            });

            resolve();
        });
    };

    /**
     * Handles received WebSocket requests and routes it to the corresponding method to construct the response.
     */
    private handleRequest = async (message: WebSocket.IMessage): Promise<Response> => {
        return new Promise(async (resolve, reject) => {
            if (message.type !== 'utf8') {
                reject(new Error('Message in unsupported format.'));
                return;
            }

            const request = Request.fromJSON(message.utf8Data);
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
                        break;
                    default:
                        result.responseCode = BAD_REQUEST;
                        result.responseBody = { message: `'${request.topic}' is not a valid topic.` };
                }
            } catch (error) {
                result.responseCode = BAD_REQUEST;
                result.responseBody = { message: error.message };
            }

            resolve(new Response(request.topic, request.id, result.responseCode, result.responseBody));
        });
    };

    /**
     * Process a {@link ProgramRequestBody} and return an object containing a body property of type {@link IProgramResponse} and a status property of type {@link ResponseCodeEnum}.
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
                        program = this.programService.getProgramById(body.programId);

                        await this.programService.executeProgramOnBoard(body.boardId, program, body.repeat);

                        result.responseCode = NO_CONTENT;
                        break;

                    case PROGRAM_REQUEST_ACTION.HALT:
                        // stop program execution
                        this.programService.stopProgram(body.boardId);
                        result.responseCode = NO_CONTENT;
                        break;

                    case PROGRAM_REQUEST_ACTION.GET:
                        const programs: Program[] = [];
                        // body program(s)
                        if (body.programId) {
                            // by id
                            programs.push(this.programService.getProgramById(body.programId));
                        } else {
                            // all programs
                            programs.push(...this.programService.getAllPrograms());
                        }

                        result.responseBody = new ProgramResponseBody({ programs });
                        result.responseCode = OK;
                        break;

                    case PROGRAM_REQUEST_ACTION.POST:
                        // add a new program
                        program = ProgramService.createProgram(body.program);
                        const id = await this.programService.addProgram(program);

                        result.responseBody = new ProgramResponseBody({ programId: id });
                        result.responseCode = CREATED;

                        break;

                    case PROGRAM_REQUEST_ACTION.PUT:
                        // update existing program
                        await this.programService.updateProgram(body.program);

                        result.responseCode = NO_CONTENT;

                        break;

                    case PROGRAM_REQUEST_ACTION.DELETE:
                        // remove existing program
                        await this.programService.deleteProgram(body.programId);

                        result.responseCode = NO_CONTENT;

                        break;

                    default:
                        // action missing from body
                        reject(
                            new Error(
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
     * Process a {@link CommandRequestBody} and return an object containing a status property of type {@link ResponseCodeEnum}.
     */
    private handleCommandRequest(body: CommandRequestBody): Promise<IRequestResult> {
        return new Promise(async (resolve, reject) => {
            const result: IRequestResult = {
                responseCode: undefined,
                responseBody: undefined,
            };

            try {
                const command: ICommand = { action: body.action, parameters: body.parameters };

                await this.programService.executeCommandOnBoard(body.boardId, command);
                result.responseCode = NO_CONTENT;

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Process a {@link ProgramRequestBody} and return an object containing a body property of type {@link IBoardResponse} and a status property of type {@link ResponseCodeEnum}.
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
                            boards.push(this.boardService.getBoardById(body.boardId).toDiscrete());
                        } else {
                            // body all boards
                            boards.push(...this.boardService.getAllBoards());
                        }

                        result.responseBody = new BoardResponseBody({ boards });
                        result.responseCode = OK;

                        break;
                    case BOARD_REQUEST_ACTION.PUT:
                        await this.boardService.updateBoard(body.board);
                        result.responseCode = NO_CONTENT;
                        break;
                    case BOARD_REQUEST_ACTION.DELETE:
                        // todo: implement
                        break;
                    default:
                        reject(
                            new Error(
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
    private handleClientConnected(): Promise<Response> {
        return new Promise(resolve => {
            const body = new BoardResponseBody({
                boards: this.boardService.getAllBoards(),
            });

            resolve(new Response(MESSAGE_TOPIC.BOARD, undefined, OK, body));
        });
    }

    /**
     * BroadcastBody an update with the newly connected board to connected clients.
     */
    private broadcastBoardConnected = (event: BoardConnectedEvent): void => {
        this.broadcastBoardUpdate(event.newBoard ? BROADCAST_ACTION.NEW : BROADCAST_ACTION.UPDATE, event.board);
    };

    /**
     * BroadcastBody the updated board to all connected clients.
     */
    private broadcastBoardUpdated = (event: BoardUpdatedEvent): void => {
        this.broadcastBoardUpdate(BROADCAST_ACTION.UPDATE, event.board);
    };

    /**
     * BroadcastBody an update with the disconnected board to connected clients.
     */
    private broadcastBoardDisconnected = (event: BoardDisconnectedEvent): void => {
        this.broadcastBoardUpdate(BROADCAST_ACTION.UPDATE, event.board);
    };

    /**
     * BroadcastBody a board property or status update.
     */
    private broadcastBoardUpdate = (action: BROADCAST_ACTION, board: IBoard): void => {
        const body: BroadcastBody = {
            action,
            payload: [board],
        };

        const message = new Broadcast(MESSAGE_TOPIC.BOARD, body);

        this.broadcast(message);
    };

    /**
     * BroadcastBody a message to all connected clients.
     */
    private broadcast(message: Broadcast): void {
        this.webSocketServer.broadcastUTF(message.toJSON());
    }
}
