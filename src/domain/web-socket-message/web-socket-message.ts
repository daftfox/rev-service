import { ResponseCode } from "./response-code";
import BoardRequest from "./body/board-request";
import BoardResponse from "./body/board-response";
import ProgramRequest from "./body/program-request";
import ProgramResponse from "./body/program-response";
import LoggerService from "../../service/logger-service";
import CommandRequest from "./body/command-request";
import * as uuid from 'uuid';
import ErrorResponse from "./body/error-response";
import BoardBroadcast from "./body/board-broadcast";

/**
 * @classdesc A class used to instantiate WebSocket messages
 */
class WebSocketMessage<T> {

    public kind: WebSocketMessageKind;
    public type: WebSocketMessageType;
    public body?: T;
    public id?: string;
    public reqId?: string;
    public code?: ResponseCode;

    private static namespace = `WebSocketMessage`;
    private static log = new LoggerService( WebSocketMessage.namespace );

    constructor( kind: WebSocketMessageKind, type: WebSocketMessageType, body?: any, reqId?: string, code?: ResponseCode, id?: string ) {
        this.type = type;
        this.kind = kind;

        if ( kind === WebSocketMessageKind.RESPONSE ) {
            this.reqId = reqId;
            this.code = code;
        } else {
            this.id = id || uuid.v4();
        }

        if ( body ) {
            this.body = body;
        }
    }

    public toJSON(): string {
        let webSocketMessage = {
            kind: this.kind,
            body: this.body,
            type: this.type,
        };

        if ( this.kind === WebSocketMessageKind.RESPONSE ) {
            Object.assign( webSocketMessage, {
                reqId: this.reqId,
                code: this.code,
            } );
        } else {
            Object.assign( webSocketMessage, {
                id: this.id,
            } );
        }

        return JSON.stringify( webSocketMessage );
    }

    public static fromJSON( jsonMessage: string ): WebSocketMessage<BoardRequest | BoardResponse | CommandRequest | ProgramRequest | ProgramResponse> {
        const { kind, body, id, reqId, code, type } = JSON.parse( jsonMessage );
        let webSocketMessage: WebSocketMessage<any>;

        // todo: decide whether or not to include responses / broadcasts in the switch.

        switch( type ) {
            // case WebSocketMessageType.BOARD_BROADCAST:
            //     webSocketMessage = new this<BoardBroadcast>( kind, type, body, reqId, code, id );
            //     break;
            case WebSocketMessageType.BOARD_REQUEST:
                webSocketMessage = new this<BoardRequest>( kind, type, body, reqId, code, id );
                break;
            // case WebSocketMessageType.BOARD_RESPONSE:
            //     webSocketMessage = new this<BoardResponse>( kind, type, body, reqId, code, id );
            //     break;
            case WebSocketMessageType.COMMAND_REQUEST:
                webSocketMessage = new this<CommandRequest>( kind, type, body, reqId, code, id );
                break;
            case WebSocketMessageType.PROGRAM_REQUEST:
                webSocketMessage = new this<ProgramRequest>( kind, type, body, reqId, code, id );
                break;
            // case WebSocketMessageType.PROGRAM_RESPONSE:
            //     webSocketMessage = new this<ProgramResponse>( kind, type, body, reqId, code, id );
            //     break;
            // case WebSocketMessageType.ERROR_RESPONSE:
            //     webSocketMessage = new this<ErrorResponse>( kind, type, body, reqId, code, id );
            //     break;
            // case WebSocketMessageType.EMPTY_RESPONSE:
            //     webSocketMessage = new this<null>( kind, type, null, reqId, code, id );
            //     break;
            default:
                WebSocketMessage.log.error( new Error( `Unknown type.` ) );
                break;
        }

        return webSocketMessage;
    }
}

export enum WebSocketMessageKind {
    REQUEST = "req",
    RESPONSE = "res",
    BROADCAST = "brc",
}

export enum WebSocketMessageType {
    BOARD_BROADCAST = 'BoardBroadcast',
    BOARD_REQUEST = 'BoardRequest',
    BOARD_RESPONSE = 'BoardResponse',
    COMMAND_REQUEST = 'CommandRequest',
    PROGRAM_REQUEST = 'ProgramRequest',
    PROGRAM_RESPONSE = 'ProgramResponse',
    EMPTY_RESPONSE = 'EmptyResponse',
    ERROR_RESPONSE = 'ErrorResponse',
}

export default WebSocketMessage;