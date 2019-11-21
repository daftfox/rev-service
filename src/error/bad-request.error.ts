import { RESPONSE_CODE } from '../domain/enum/response-code.enum';

class BadRequest extends Error {
    code = RESPONSE_CODE.BAD_REQUEST;

    constructor(message: string) {
        super(message);

        this.name = 'BadRequest';
    }
}

export default BadRequest;
