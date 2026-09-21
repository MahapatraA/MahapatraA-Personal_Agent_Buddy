import express, { Express } from 'express';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
