import { RESPONSE_CODE } from '../domain/enum/response-code.enum';

class Conflict extends Error {
    code = RESPONSE_CODE.CONFLICT;

    constructor(message: string) {
        super(message);

        this.name = 'Conflict';
    }
}

export default Conflict;
