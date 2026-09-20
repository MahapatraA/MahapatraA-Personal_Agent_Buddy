import { afterAll, describe, expect, it } from 'vitest';
import { checkDatabaseConnection } from '../../src/db/health';
import { closeDatabase } from '../../src/db/client';

const databaseUrl = process.env.DATABASE_URL;

describe.runIf(Boolean(databaseUrl))('PostgreSQL connectivity', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('connects to the configured PostgreSQL database', async () => {
    await expect(checkDatabaseConnection()).resolves.toBeUndefined();
  });
});
