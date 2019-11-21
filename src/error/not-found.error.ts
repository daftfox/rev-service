import { RESPONSE_CODE } from '../domain/enum/response-code.enum';

class NotFound extends Error {
    code = RESPONSE_CODE.NOT_FOUND;

    constructor(message: string) {
        super(message);

        this.name = 'NotFound';
    }
}

export default NotFound;
