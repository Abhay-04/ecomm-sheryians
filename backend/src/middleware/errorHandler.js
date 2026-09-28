import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Express recognises an error handler by its four arguments, so `next` must stay
// in the signature even though it's unused.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  let statusCode = 500;
  let message = 'Something went wrong. Please try again later.';
  let errors;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors;
  } else if (error instanceof mongoose.Error.CastError) {
    // Safety net: IDs are validated before queries, but this covers anything missed.
    statusCode = 400;
    message = `Invalid ${error.path}`;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));
  } else if (error.code === 11000) {
    // MongoDB duplicate key error (unique index violation)
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  }

  if (statusCode === 500) {
    // Log the full error on the server only. Request bodies are never logged,
    // so passwords and tokens don't end up in log files.
    console.error(error);
  }

  const responseBody = { message };
  if (errors) responseBody.errors = errors;
  if (statusCode === 500 && !env.isProduction) responseBody.stack = error.stack;

  res.status(statusCode).json(responseBody);
}
