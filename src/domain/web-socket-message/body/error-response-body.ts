import { IErrorResponse } from '../interface';

export class ErrorResponseBody implements IErrorResponse {
    message: string;

    constructor(values: IErrorResponse) {
        Object.assign(this, values);
    }
}
