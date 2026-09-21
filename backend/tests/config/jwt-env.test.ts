import { describe, expect, it } from 'vitest';
import { loadEnv, parseJwtSecret } from '../../src/config/env';

describe('parseJwtSecret', () => {
  it('returns undefined when the value is missing or blank', () => {
    expect(parseJwtSecret(undefined)).toBeUndefined();
    expect(parseJwtSecret('')).toBeUndefined();
    expect(parseJwtSecret('   ')).toBeUndefined();
  });

  it('returns the configured value unchanged', () => {
    expect(parseJwtSecret('a-configured-secret')).toBe('a-configured-secret');
  });
});

describe('JWT_SECRET environment handling', () => {
  it('allows an absent secret outside production', () => {
    expect(loadEnv({ NODE_ENV: 'development' }).jwtSecret).toBeUndefined();
    expect(loadEnv({ NODE_ENV: 'test' }).jwtSecret).toBeUndefined();
  });

  it('requires an explicit secret in production', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
  });

  it('rejects a weak secret in production', () => {
    expect(() => loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'too-short' })).toThrow(/JWT_SECRET/);
  });

  it('accepts a strong secret in production', () => {
    const secret = 'strong-production-secret-value-of-sufficient-length';
    const loaded = loadEnv({ NODE_ENV: 'production', JWT_SECRET: secret });

    expect(loaded.isProduction).toBe(true);
    expect(loaded.jwtSecret).toBe(secret);
  });
});
