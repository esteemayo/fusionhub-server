import { StatusCodes } from 'http-status-codes';

import { CustomAPIError } from './cutom.api.error.js';

export class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.status = 'fail';
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}
