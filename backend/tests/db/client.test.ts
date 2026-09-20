import { describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { createDatabase, createPool, resolveDatabaseUrl } from '../../src/db/client';

const connectionString = 'postgresql://buddy:change_me@localhost:5432/buddy';

describe('database client', () => {
  it('resolves a configured DATABASE_URL', () => {
    expect(resolveDatabaseUrl(connectionString)).toBe(connectionString);
  });

  it('throws a clear error when DATABASE_URL is missing', () => {
    expect(() => resolveDatabaseUrl(undefined)).toThrow(/DATABASE_URL/);
  });

  it('creates a PostgreSQL pool for a connection string', async () => {
    const pool = createPool(connectionString);

    expect(pool).toBeInstanceOf(Pool);

    await pool.end();
  });

  it('creates a Drizzle database over a pool', async () => {
    const pool = createPool(connectionString);
    const database = createDatabase(pool);

    expect(database).toBeDefined();

    await pool.end();
  });
});
