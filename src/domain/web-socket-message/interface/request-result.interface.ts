import { BoardResponseBody, ErrorResponseBody, ProgramResponseBody } from '../body';

export interface IRequestResult {
    responseBody: BoardResponseBody | ProgramResponseBody | ErrorResponseBody;
    responseCode: number;
}
