import { describe, expect, it } from 'vitest';
import { loadEnv, parseDatabaseUrl } from '../../src/config/env';

describe('parseDatabaseUrl', () => {
  it('returns undefined when the value is missing or empty', () => {
    expect(parseDatabaseUrl(undefined)).toBeUndefined();
    expect(parseDatabaseUrl('')).toBeUndefined();
    expect(parseDatabaseUrl('   ')).toBeUndefined();
  });

  it('accepts postgres and postgresql connection URLs', () => {
    const postgresql = 'postgresql://buddy:change_me@localhost:5432/buddy';
    const postgres = 'postgres://buddy:change_me@localhost:5432/buddy';

    expect(parseDatabaseUrl(postgresql)).toBe(postgresql);
    expect(parseDatabaseUrl(postgres)).toBe(postgres);
  });

  it('rejects malformed and non-postgres URLs', () => {
    expect(() => parseDatabaseUrl('not-a-url')).toThrow(/DATABASE_URL/);
    expect(() => parseDatabaseUrl('mysql://buddy:change_me@localhost:3306/buddy')).toThrow(
      /DATABASE_URL/
    );
  });
});

describe('loadEnv', () => {
  it('loads PostgreSQL connection settings from the environment', () => {
    const loaded = loadEnv({
      NODE_ENV: 'test',
      PORT: '4000',
      DATABASE_URL: 'postgresql://buddy:change_me@localhost:5432/buddy'
    });

    expect(loaded.nodeEnv).toBe('test');
    expect(loaded.port).toBe(4000);
    expect(loaded.isProduction).toBe(false);
    expect(loaded.databaseUrl).toBe('postgresql://buddy:change_me@localhost:5432/buddy');
  });

  it('leaves DATABASE_URL undefined when it is not configured', () => {
    const loaded = loadEnv({});

    expect(loaded.nodeEnv).toBe('development');
    expect(loaded.port).toBe(3000);
    expect(loaded.databaseUrl).toBeUndefined();
  });
});
