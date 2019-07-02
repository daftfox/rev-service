"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("websocket");
const web_socket_message_1 = require("../domain/web-socket-message/web-socket-message");
const logger_1 = require("./logger");
const http_service_1 = require("./http-service");
const chalk_1 = require("chalk");
const board_request_1 = require("../domain/web-socket-message/body/board-request");
const response_code_1 = require("../domain/web-socket-message/response-code");
const program_request_1 = require("../domain/web-socket-message/body/program-request");
const board_broadcast_1 = require("../domain/web-socket-message/body/board-broadcast");
const bad_request_1 = require("../domain/web-socket-message/error/bad-request");
const not_found_1 = require("../domain/web-socket-message/error/not-found");
const method_not_allowed_1 = require("../domain/web-socket-message/error/method-not-allowed");
const command_malformed_1 = require("../error/command-malformed");
const command_unavailable_1 = require("../error/command-unavailable");
/**
 * @description Service that allows clients to interface using a near real-time web socket connection
 * @namespace WebSocketService
 */
class WebSocketService {
    /**
     * @constructor
     * @param {number} port - The port of which to accept WebSocket connection requests.
     * @param {Boards} boardModel - The {@link Board} instances model.
     * @param {Programs} programModel - The {@link Programs} instances model.
     */
    constructor(port, boardModel, programModel) {
        this.port = port;
        this.httpServer = new http_service_1.default(this.port).server;
        this.boardModel = boardModel;
        this.programModel = programModel;
        this.boardModel.addBoardConnectedListener(this.broadcastBoardConnected.bind(this));
        this.boardModel.addBoardUpdatedListener(this.broadcastBoardUpdated.bind(this));
        this.boardModel.addBoardDisconnectedListener(this.broadcastBoardDisconnected.bind(this));
        this.startWebSocketServer();
    }
    /**
     * Start the WebSocket server
     *
     * @access private
     * @return {void}
     */
    startWebSocketServer() {
        this.webSocketServer = new WebSocket.server({
            httpServer: this.httpServer
        });
        WebSocketService.log.info(`Listening on port ${chalk_1.default.rgb(240, 240, 30).bold(JSON.stringify((this.port)))}.`);
        this.webSocketServer.on('request', this.handleConnectionRequest.bind(this));
    }
    /**
     * Handles new WebSocket connection requests.
     *
     * @access private
     * @param {WebSocket.request} request - The connection request that was received
     * @return {void}
     */
    handleConnectionRequest(request) {
        let client = request.accept(null, request.origin);
        this.handleClientConnected()
            .then(response => WebSocketService.sendResponse(client, response));
        client.on('message', (message) => {
            this.handleMessageReceived(message)
                .then(response => WebSocketService.sendResponse(client, response));
        });
        client.on('close', () => {
            client = null;
        });
    }
    /**
     * Handles received WebSocket requests and routes it to the corresponding method to construct the response.
     *
     * @async
     * @access private
     * @param {{ type: string, utf8Data: any }} message -
     * @return {Promise<WebSocketMessage<any>>} Promise resolving to a response in the shape of an instance of WebSocketMessage.
     */
    handleMessageReceived(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.type !== "utf8")
                WebSocketService.log.warn('Message received in wrong encoding format. Supported format is utf8');
            const request = web_socket_message_1.default.fromJSON(message.utf8Data);
            let result;
            let response;
            try {
                switch (request.type) {
                    case web_socket_message_1.WebSocketMessageType.BOARD_REQUEST:
                        result = yield this.handleBoardRequest(request);
                        response = WebSocketService.getWebSocketMessageResponse(web_socket_message_1.WebSocketMessageType.BOARD_RESPONSE, request.id, result.code, result.body);
                        break;
                    case web_socket_message_1.WebSocketMessageType.COMMAND_REQUEST:
                        result = yield this.handleCommandRequest(request);
                        break;
                    case web_socket_message_1.WebSocketMessageType.PROGRAM_REQUEST:
                        result = yield this.handleProgramRequest(request);
                        if (result.code === response_code_1.ResponseCode.OK || result.code === response_code_1.ResponseCode.CREATED) {
                            response = WebSocketService.getWebSocketMessageResponse(web_socket_message_1.WebSocketMessageType.PROGRAM_RESPONSE, request.id, result.code, result.body);
                        }
                        break;
                }
                if (result.code === response_code_1.ResponseCode.NO_CONTENT) {
                    response = WebSocketService.getEmptyWebSocketMessageResponse(request.id, result.code);
                }
            }
            catch (error) {
                response = WebSocketService.getWebSocketMessageResponse(web_socket_message_1.WebSocketMessageType.ERROR_RESPONSE, request.id, error.code, error.responseBody);
            }
            return Promise.resolve(response);
        });
    }
    /**
     * Construct an instance of {@link WebSocketMessage} with the provided parameters.
     *
     * @static
     * @access private
     * @param {WebSocketMessageType} type - The type of {@link WebSocketMessage} to construct.
     * @param {string} requestId - The ID the message to construct is a response to.
     * @param {ResponseCode} responseCode - HTTP response code.
     * @param {any} body - The body to add to the payload.
     * @return {WebSocketMessage<T>} The instance of {@link WebSocketMessage} that was constructed.
     */
    static getWebSocketMessageResponse(type, requestId, responseCode, body) {
        return new web_socket_message_1.default(web_socket_message_1.WebSocketMessageKind.RESPONSE, type, body, requestId, responseCode);
    }
    /**
     * Construct an instance of {@link WebSocketMessage} with the provided parameters.
     *
     * @static
     * @access private
     * @param {WebSocketMessageType} type - The type of {@link WebSocketMessage} to construct.
     * @param {any} body - The body to add to the payload.
     * @return {WebSocketMessage<T>} The instance of {@link WebSocketMessage} that was constructed.
     */
    static getWebSocketMessageBroadcast(type, body) {
        return new web_socket_message_1.default(web_socket_message_1.WebSocketMessageKind.BROADCAST, type, body);
    }
    /**
     * Construct an instance of {@link WebSocketMessage} containing details about the nature of the error.
     *
     * @static
     * @access private
     * @param {string} requestId - The ID the error message to construct is a response to.
     * @param {ResponseCode} code - HTTP response code.
     * @return {WebSocketMessage<null>} The instance of {@link WebSocketMessage} that was constructed.
     */
    static getEmptyWebSocketMessageResponse(requestId, code) {
        return WebSocketService.getWebSocketMessageResponse(web_socket_message_1.WebSocketMessageType.EMPTY_RESPONSE, requestId, code);
    }
    /**
     * Process a {@link ProgramRequest} and return an object containing a body property of type {@link ProgramResponse} and a code property of type {@link ResponseCode}.
     * If the requested action did not produce a body, the returned type of body is null.
     *
     * @access private
     * @param {WebSocketMessage<ProgramRequest>} request - The request body to process.
     * @return {Promise<{ body: ProgramResponse | null, code: ResponseCode }>} Promise that resolves to an object containing a body property of type {@link ProgramResponse} and a code property of type {@link ResponseCode}.
     */
    handleProgramRequest(request) {
        return new Promise((resolve, reject) => {
            const result = {
                body: {},
                code: response_code_1.ResponseCode.OK,
            };
            switch (request.body.action) {
                case program_request_1.ProgramAction.EXECUTE:
                    // execute program
                    this.programModel.getProgramById(request.body.programId)
                        .then(program => {
                        this.boardModel.executeProgramOnBoard(request.body.boardId, program, request.body.repeat)
                            .catch(reject);
                        // send back a response as soon as the program has started executing so we can handle errors that might pop up in the meantime.
                        setTimeout(() => {
                            result.code = response_code_1.ResponseCode.NO_CONTENT;
                            resolve(result);
                        });
                    });
                    break;
                case program_request_1.ProgramAction.STOP:
                    // stop program execution
                    this.boardModel.stopProgram(request.body.boardId);
                    result.code = response_code_1.ResponseCode.NO_CONTENT;
                    break;
                case program_request_1.ProgramAction.REQUEST:
                    // request program(s)
                    if (request.body.programId) {
                        // by id
                        this.programModel.getProgramById(request.body.programId)
                            .catch(reject)
                            .then(program => {
                            Object.assign(result.body, { programs: [program] });
                            resolve(result);
                        });
                    }
                    else {
                        // all programs
                        this.programModel.programs
                            .then(programs => {
                            Object.assign(result.body, { programs: programs });
                            resolve(result);
                        });
                    }
                    break;
                case program_request_1.ProgramAction.CREATE:
                    // add a new program
                    this.programModel.addProgram(request.body.program)
                        .catch(reject)
                        .then(id => {
                        Object.assign(result, { body: { programId: id }, code: response_code_1.ResponseCode.CREATED });
                        resolve(result);
                    });
                    break;
                case program_request_1.ProgramAction.UPDATE:
                    // update existing program
                    this.programModel.updateProgram(request.body.programId, request.body.program)
                        .then(() => {
                        result.code = response_code_1.ResponseCode.NO_CONTENT;
                        resolve(result);
                    });
                    break;
                case program_request_1.ProgramAction.DELETE:
                    // remove existing program
                    this.programModel.removeProgram(request.body.programId)
                        .catch(error => {
                        reject(error);
                    })
                        .then(() => {
                        result.code = response_code_1.ResponseCode.NO_CONTENT;
                        resolve(result);
                    });
                    break;
                default:
                    // action missing from body
                    reject(new bad_request_1.default(`Body property 'program' missing.`));
            }
        });
    }
    /**
     * Process a {@link CommandRequest} and return an object containing a code property of type {@link ResponseCode}.
     *
     * @access private
     * @param {WebSocketMessage<CommandRequest>} request - The request body to process.
     * @return {Promise<{code: ResponseCode}>} Promise that resolves to an object with a code property of type {@link ResponseCode}.
     */
    handleCommandRequest(request) {
        return new Promise((resolve, reject) => {
            const result = {
                code: response_code_1.ResponseCode.NO_CONTENT
            };
            const board = this.boardModel.getBoardById(request.body.boardId);
            const command = { action: request.body.action, parameters: request.body.parameters };
            if (!board) {
                // no board with that ID found
                reject(new not_found_1.default(`Board with id ${request.body.boardId} could not be found.`));
            }
            else {
                this.boardModel.executeActionOnBoard(board.id, command)
                    .catch((error) => {
                    if (error instanceof command_malformed_1.default) {
                        // command is (likely) missing parameters
                        reject(new bad_request_1.default(error.message));
                    }
                    else if (error instanceof command_unavailable_1.default) {
                        // board does not support this command
                        reject(new method_not_allowed_1.default(error.message));
                    }
                    else {
                        reject(error);
                    }
                })
                    .then(() => {
                    // command executed successfully
                    resolve(result);
                });
            }
        });
    }
    /**
     * Process a {@link ProgramRequest} and return an object containing a body property of type {@link BoardResponse} and a code property of type {@link ResponseCode}.
     * If the requested action did not produce a body, the returned type of body is null.
     *
     * @access private
     * @param {WebSocketMessage} request - The request body to process.
     * @return {WebSocketMessage<BoardResponse>} Promise resolving to an object containing a body property of type {@link BoardResponse} and a code property of type {@link ResponseCode}.
     */
    handleBoardRequest(request) {
        return new Promise((resolve, reject) => {
            const result = {
                body: {
                    boards: [],
                },
                code: response_code_1.ResponseCode.OK,
            };
            if (request.body.action === board_request_1.BoardAction.REQUEST) {
                if (request.body.boardId) {
                    // request single board
                    let board = this.boardModel.getBoardById(request.body.boardId);
                    if (!board) {
                        reject(new not_found_1.default(`Board with id ${request.body.boardId} could not be found.`));
                    }
                    else {
                        Object.assign(result.body, { boards: [board] });
                    }
                }
                else {
                    // request all boards
                    Object.assign(result.body, { boards: this.boardModel.boards });
                }
            }
            else if (request.body.action === board_request_1.BoardAction.UPDATE) {
                // board update
                this.boardModel.updateBoard(request.body.board, true);
                result.code = response_code_1.ResponseCode.NO_CONTENT;
            }
            else {
                // illegal action
                reject(new bad_request_1.default(`Only actions ${board_request_1.BoardAction.REQUEST} and ${board_request_1.BoardAction.UPDATE} are allowed.`));
            }
            resolve(result);
        });
    }
    /**
     * Send newly connected client a list of all known boards (online or not).
     *
     * @access private
     * @return {Promise<WebSocketMessage<BoardBroadcast>>} Promise resolving to an instance of {@link WebSocketMessage<BoardBroadcast>}
     */
    handleClientConnected() {
        return new Promise((resolve) => {
            const body = {
                action: board_broadcast_1.BOARD_BROADCAST_ACTION.REPLACE,
                boards: this.boardModel.boards,
            };
            resolve(new web_socket_message_1.default(web_socket_message_1.WebSocketMessageKind.BROADCAST, web_socket_message_1.WebSocketMessageType.BOARD_BROADCAST, body));
        });
    }
    /**
     * Broadcast an update with the newly connected board to connected clients.
     *
     * @access private
     * @param {IBoard} board - The board that was connected
     * @return {void}
     */
    broadcastBoardConnected(board, newRecord) {
        this.broadcastBoardUpdate((newRecord ? board_broadcast_1.BOARD_BROADCAST_ACTION.NEW : board_broadcast_1.BOARD_BROADCAST_ACTION.UPDATE), board);
    }
    /**
     * Broadcast the updated board to all connected clients.
     *
     * @access private
     * @param {IBoard} board - The board that was updated.
     * @return {void}
     */
    broadcastBoardUpdated(board) {
        this.broadcastBoardUpdate(board_broadcast_1.BOARD_BROADCAST_ACTION.UPDATE, board);
    }
    /**
     * Broadcast an update with the disconnected board to connected clients.
     *
     * @access private
     * @param {IBoard} board - The board that has disconnected.
     * @return {void}
     */
    broadcastBoardDisconnected(board) {
        this.broadcastBoardUpdate(board_broadcast_1.BOARD_BROADCAST_ACTION.UPDATE, board);
    }
    /**
     * Broadcast a board property or status update.
     *
     * @access private
     * @param {BOARD_BROADCAST_ACTION} action - The type of update.
     * @param {IBoard} board - The board whose properties or status have updated.
     * @return {void}
     */
    broadcastBoardUpdate(action, board) {
        const body = {
            action: action,
            boards: [board],
        };
        const message = WebSocketService.getWebSocketMessageBroadcast(web_socket_message_1.WebSocketMessageType.BOARD_BROADCAST, body);
        this.broadcast(message);
    }
    /**
     * Broadcast a message to all connected clients.
     *
     * @access private
     * @param {WebSocketMessage<any>} message - The {@link WebSocketMessage} to broadcast to connected clients.
     * @return {void}
     */
    broadcast(message) {
        this.webSocketServer.broadcastUTF(message.toJSON());
    }
    /**
     * Send a response message to a specific client.
     *
     * @static
     * @access private
     * @param {WebSocket.connection} client - The client to send the message to.
     * @param {WebSocketMessage} response - The response message to send to the client.
     * @return {void}
     */
    static sendResponse(client, response) {
        client.sendUTF(response.toJSON());
    }
}
/**
 * @static
 * @type {string}
 * @access private
 */
WebSocketService.namespace = `web-socket`;
/**
 * @static
 * @type Logger
 * @access private
 */
WebSocketService.log = new logger_1.default(WebSocketService.namespace);
exports.default = WebSocketService;
//# sourceMappingURL=web-socket-service.js.map