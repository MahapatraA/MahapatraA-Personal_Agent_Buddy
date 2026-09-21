import { describe, expect, it } from 'vitest';
import { generateRefreshToken, hashRefreshToken } from '../../src/utils/refresh-token';

describe('refresh tokens', () => {
  it('generates unpredictable, high-entropy opaque tokens', () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('hashes deterministically to a sha-256 hex digest', () => {
    const token = generateRefreshToken();
    const hash = hashRefreshToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashRefreshToken(token)).toBe(hash);
  });

  it('never stores the plaintext token as its stored representation', () => {
    const token = generateRefreshToken();

    expect(hashRefreshToken(token)).not.toBe(token);
  });
});
