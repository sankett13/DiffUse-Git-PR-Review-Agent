export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.isOperational = true;

    // Restore prototype chain for `instanceof` checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace excluding constructor
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Some helper factories for common HTTP errors
export const BadRequest = (message = "Bad request") =>
  new AppError(message, 400);

export const Unauthorized = (message = "Unauthorized") =>
  new AppError(message, 401);

export const Forbidden = (message = "Forbidden") => new AppError(message, 403);

export const NotFound = (message = "Not found") => new AppError(message, 404);

export const InternalServerError = (message = "Something went wrong") =>
  new AppError(message, 500);
