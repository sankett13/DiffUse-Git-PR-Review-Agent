import type { NextFunction, Request, Response } from "express";

// Utility to wrap async route handlers and forward errors to the global error handler
export const asyncHandler =
  <P, ResBody, ReqBody, ReqQuery>(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response<ResBody>,
      next: NextFunction,
    ) => Promise<unknown>,
  ) =>
  (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => {
    void fn(req, res, next).catch(next);
  };
