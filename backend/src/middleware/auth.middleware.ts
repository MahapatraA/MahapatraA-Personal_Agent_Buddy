import { NextFunction, Request, Response } from 'express';
import { unauthorized } from '../errors/http-error';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (typeof header !== 'string') {
    throw unauthorized();
  }

  const [scheme, token, ...rest] = header.split(' ');

  if (scheme !== 'Bearer' || token === undefined || token === '' || rest.length > 0) {
    throw unauthorized();
  }

  const payload = verifyAccessToken(token);

  req.user = { id: payload.sub };
  next();
};
