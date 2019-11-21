import IErrorResponse from '../../interface/error-response-body.interface';

export default class ErrorResponseBody implements IErrorResponse {
    message: string;

    constructor(values: IErrorResponse) {
        Object.assign(this, values);
    }
}
