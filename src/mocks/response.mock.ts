import {MESSAGE_TOPIC} from "../domain/web-socket-message/enum";
import {OK} from "http-status-codes";
import {BoardResponseBody} from "../domain/web-socket-message/body";
import {Response} from "../domain/web-socket-message/base";

export const responseMock = new Response(MESSAGE_TOPIC.BOARD, '1234', OK, new BoardResponseBody({ boards: [] }));