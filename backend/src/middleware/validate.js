import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Runs after a list of express-validator rules. If any rule failed, the request
// stops here with a 400 and the controller never executes.
export function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  // onlyFirstError keeps one message per field, which is what a form can display.
  const errors = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  next(new ApiError(400, 'Validation failed', errors));
}
