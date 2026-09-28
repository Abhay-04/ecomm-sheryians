// An error with an HTTP status code. Thrown from controllers/middleware and
// turned into a JSON response by the central error handler.
export class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
