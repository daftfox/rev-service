"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("websocket");
const web_socket_message_1 = require("../domain/web-socket-message");
const logger_1 = require("./logger");
const http_service_1 = require("./http-service");
const board_1 = require("../domain/board");
const chalk_1 = require("chalk");
const web_socket_message_2 = require("../domain/web-socket-message");
const board_event_1 = require("../interface/board-event");
const command_service_1 = require("./command-service");
/**
 * @classdesc Service that allows clients to interface using a near real-time web socket connection
 * @namespace WebSocketService
 */
class WebSocketService {
    /**
     * @constructor
     * @param {number} port
     * @param {port} model
     */
    constructor(port, model) {
        this.log = new logger_1.default(WebSocketService.namespace);
        this.port = port;
        this.httpServer = new http_service_1.default(this.port).server;
        this.model = model;
        this.model.addBoardConnectedListener(this.broadcastBoardConnected.bind(this));
        this.model.addBoardUpdatedListener(this.broadcastBoardUpdated.bind(this));
        this.model.addBoardDisconnectedListener(this.broadcastBoardDisconnected.bind(this));
        this.startWebSocketServer();
    }
    /**
     * Start the WebSocket server
     * @access private
     */
    startWebSocketServer() {
        this.webSocketServer = new WebSocket.server({
            httpServer: this.httpServer
        });
        this.log.info(`Listening on port ${chalk_1.default.rgb(240, 240, 30).bold(JSON.stringify((this.port)))}.`);
        this.webSocketServer.on('request', this.handleConnectionRequest.bind(this));
    }
    /**
     * Handles new WebSocket connection requests
     * @access private
     * @param {request} request
     */
    handleConnectionRequest(request) {
        let connection = request.accept(null, request.origin);
        this.handleClientConnected(connection);
        connection.on('message', this.handleMessageReceived.bind(this));
        connection.on('close', () => {
            connection = null;
        });
    }
    handleMessageReceived(message) {
        if (message.type !== "utf8")
            this.log.warn('Message received in wrong encoding format. Supported format is utf8');
        const webSocketMessage = JSON.parse(message.utf8Data);
        switch (webSocketMessage.type) {
            case web_socket_message_2.WebSocketMessageType.COMMAND_EVENT:
                const board = this.model.getBoardById(webSocketMessage.payload.boardId);
                const command = { action: webSocketMessage.payload.action, parameters: webSocketMessage.payload.parameters };
                command_service_1.default.executeCommand(board, command);
                break;
        }
    }
    /**
     * @access public
     * @param {WebSocket.connection} client
     * @return {void}
     */
    handleClientConnected(client) {
        this.sendEvent(client, new web_socket_message_1.default(web_socket_message_2.WebSocketMessageType.BOARD_EVENT, {
            action: board_event_1.BoardActionType.UPDATE_ALL,
            data: board_1.default.toDiscreteArray(this.model.boards)
        }));
    }
    /**
     * Broadcast an update with the newly connected board to connected clients.
     * @access private
     * @param {Board} board The board that was connected
     */
    broadcastBoardConnected(board) {
        this.broadcastEvent(new web_socket_message_1.default(web_socket_message_2.WebSocketMessageType.BOARD_EVENT, {
            action: board_event_1.BoardActionType.ADD,
            data: [board_1.default.toDiscrete(board)]
        }));
    }
    broadcastBoardUpdated(board) {
        this.broadcastEvent(new web_socket_message_1.default(web_socket_message_2.WebSocketMessageType.BOARD_EVENT, {
            action: board_event_1.BoardActionType.UPDATE,
            data: [board_1.default.toDiscrete(board)]
        }));
    }
    /**
     * Broadcast an update with the disconnected board to connected clients.
     * @access private
     * @param {Board} board
     */
    broadcastBoardDisconnected(board) {
        this.broadcastEvent(new web_socket_message_1.default(web_socket_message_2.WebSocketMessageType.BOARD_EVENT, {
            action: board_event_1.BoardActionType.REMOVE,
            data: [board_1.default.toDiscrete(board)]
        }));
    }
    /**
     * @access public
     * @param {WebSocketMessage} event
     */
    broadcastEvent(event) {
        this.webSocketServer.broadcastUTF(event.toString());
    }
    /**
     * @access public
     * @param {connection} connection
     * @param {WebSocketMessage} event
     */
    sendEvent(connection, event) {
        connection.sendUTF(event.toString());
    }
}
/**
 * @type {string}
 * @access private
 */
WebSocketService.namespace = `web-socket`;
exports.default = WebSocketService;
//# sourceMappingURL=web-socket-service.js.map