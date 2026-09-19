import { Server } from 'node:http';
import { app } from './app';
import { env } from './config/env';

const server: Server = app.listen(env.port, () => {
  console.log(`Buddy backend listening on port ${env.port} [${env.nodeEnv}]`);
});

server.on('error', (error) => {
  console.error('Failed to start Buddy backend:', error);
  process.exit(1);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`Received ${signal}. Shutting down Buddy backend.`);

  server.close((error?: Error) => {
    if (error) {
      console.error('Error while shutting down:', error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
