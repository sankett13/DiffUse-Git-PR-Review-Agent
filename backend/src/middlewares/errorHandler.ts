import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";
import { ENV } from "../validations/env.schema.js";

// Shape of error responses we send to the client
interface ErrorResponseBody {
  status: "fail" | "error";
  message: string;
  // Only present in non-production environments
  stack?: string | undefined;
}

const isDev = ENV.NODE_ENV === "development";

const sendErrorDev = (err: AppError | Error, res: Response) => {
  const statusCode = (err as AppError).statusCode ?? 500;
  const status =
    (err as AppError).status ??
    (statusCode >= 400 && statusCode < 500 ? "fail" : "error");

  const body: ErrorResponseBody = {
    status,
    message: err.message,
    stack: err.stack,
  };

  res.status(statusCode).json(body);
};

const sendErrorProd = (err: AppError | Error, res: Response) => {
  const appError = err as AppError;
  const statusCode = appError.statusCode ?? 500;
  const status =
    appError.status ??
    (statusCode >= 400 && statusCode < 500 ? "fail" : "error");

  // If it's an operational error (expected, known), send its message
  if (appError.isOperational) {
    const body: ErrorResponseBody = {
      status,
      message: appError.message,
    };

    res.status(statusCode).json(body);
    return;
  }

  // For programming or unknown errors, don't leak internals in production
  // You would normally also log this error to a logging service here.
  const body: ErrorResponseBody = {
    status: "error",
    message: "Something went wrong.",
  };

  res.status(500).json(body);
};

// Global error-handling middleware
// IMPORTANT: Must have 4 arguments (err, req, res, next)
// so that Express recognizes it as an error handler.
export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (isDev) {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};
