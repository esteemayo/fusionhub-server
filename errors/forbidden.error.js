import { StatusCodes } from 'http-status-codes';

import CustomAPIError from './cutom.api.error.js';

class ForbiddenError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.status = 'fail';
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

export default ForbiddenError;
