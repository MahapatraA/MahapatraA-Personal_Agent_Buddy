import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export interface Env {
  nodeEnv: string;
  port: number;
  isProduction: boolean;
}

const DEFAULT_PORT = 3000;

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value "${value}": expected an integer between 1 and 65535.`);
  }

  return port;
}

export const env: Env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  isProduction: process.env.NODE_ENV === 'production'
};
