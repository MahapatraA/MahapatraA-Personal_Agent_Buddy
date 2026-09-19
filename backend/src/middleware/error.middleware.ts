import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

interface HttpError extends Error {
  status?: number;
}

export const errorHandler = (
  error: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = typeof error.status === 'number' ? error.status : 500;
  const isServerError = status >= 500;
  const hideDetails = isServerError && env.isProduction;

  const body = {
    error: {
      status,
      message: hideDetails ? 'Internal server error' : error.message,
      stack: hideDetails ? undefined : error.stack
    }
  };

  res.status(status).json(body);
};
