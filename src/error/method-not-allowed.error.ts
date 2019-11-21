import { RESPONSE_CODE } from '../domain/enum/response-code.enum';

class MethodNotAllowed extends Error {
    code = RESPONSE_CODE.METHOD_NOT_ALLOWED;

    constructor(message: string) {
        super(message);

        this.name = 'MethodNotAllowed';
    }
}

export default MethodNotAllowed;
