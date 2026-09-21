import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export interface Env {
  nodeEnv: string;
  port: number;
  isProduction: boolean;
  databaseUrl: string | undefined;
  jwtSecret: string | undefined;
}

const DEFAULT_PORT = 3000;
const MIN_PRODUCTION_JWT_SECRET_LENGTH = 32;

export function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value "${value}": expected an integer between 1 and 65535.`);
  }

  return port;
}

export function parseDatabaseUrl(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Invalid DATABASE_URL: expected a valid PostgreSQL connection URL.');
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('Invalid DATABASE_URL: expected a postgresql:// connection URL.');
  }

  return value;
}

export function parseJwtSecret(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  return value;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const nodeEnv = source.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';
  const jwtSecret = parseJwtSecret(source.JWT_SECRET);

  if (isProduction && jwtSecret === undefined) {
    throw new Error('JWT_SECRET must be explicitly configured in production.');
  }

  if (isProduction && jwtSecret !== undefined && jwtSecret.length < MIN_PRODUCTION_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_PRODUCTION_JWT_SECRET_LENGTH} characters long in production.`
    );
  }

  return {
    nodeEnv,
    port: parsePort(source.PORT),
    isProduction,
    databaseUrl: parseDatabaseUrl(source.DATABASE_URL),
    jwtSecret
  };
}

export const env: Env = loadEnv();
