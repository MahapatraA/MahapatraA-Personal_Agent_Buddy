import { Request, Response } from 'express';
import { env } from '../config/env';

export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString()
  });
};
