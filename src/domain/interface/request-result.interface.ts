import { RESPONSE_CODE } from '../enum/response-code.enum';
import BoardResponseBody from '../web-socket-message/body/board-response-body';
import ProgramResponseBody from '../web-socket-message/body/program-response-body';
import ErrorResponseBody from '../web-socket-message/body/error-response-body';

export default interface IRequestResult {
    responseBody: BoardResponseBody | ProgramResponseBody | ErrorResponseBody;
    responseCode: RESPONSE_CODE;
}
