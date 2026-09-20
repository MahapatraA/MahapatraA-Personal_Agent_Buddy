import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let database: Database | undefined;

export function resolveDatabaseUrl(databaseUrl: string | undefined): string {
  if (databaseUrl === undefined) {
    throw new Error('DATABASE_URL is not configured. Set it to connect to PostgreSQL.');
  }

  return databaseUrl;
}

export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

export function createDatabase(connectionPool: Pool): Database {
  return drizzle(connectionPool, { schema });
}

export function getPool(): Pool {
  if (pool === undefined) {
    pool = createPool(resolveDatabaseUrl(env.databaseUrl));
  }

  return pool;
}

export function getDatabase(): Database {
  if (database === undefined) {
    database = createDatabase(getPool());
  }

  return database;
}

export async function closeDatabase(): Promise<void> {
  if (pool === undefined) {
    return;
  }

  await pool.end();
  pool = undefined;
  database = undefined;
}
