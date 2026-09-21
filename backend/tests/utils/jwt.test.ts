import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { getJwtSecret, signAccessToken, verifyAccessToken } from '../../src/utils/jwt';

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('access tokens', () => {
  it('signs a JWT whose subject is the user id', () => {
    const token = signAccessToken(USER_ID);

    expect(token.split('.')).toHaveLength(3);
    expect(verifyAccessToken(token).sub).toBe(USER_ID);
  });

  it('includes only the required identity claims', () => {
    const payload = verifyAccessToken(signAccessToken(USER_ID));

    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub']);
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({ sub: USER_ID }, 'a-different-signing-secret', {
      algorithm: 'HS256',
      expiresIn: 60
    });

    expect(() => verifyAccessToken(forged)).toThrow(/access token/i);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ sub: USER_ID }, getJwtSecret(), {
      algorithm: 'HS256',
      expiresIn: -10
    });

    expect(() => verifyAccessToken(expired)).toThrow(/access token/i);
  });

  it('rejects a token whose subject is not a UUID', () => {
    const invalid = jwt.sign({ sub: 'not-a-uuid' }, getJwtSecret(), {
      algorithm: 'HS256',
      expiresIn: 60
    });

    expect(() => verifyAccessToken(invalid)).toThrow(/access token/i);
  });

  it('rejects a malformed token', () => {
    expect(() => verifyAccessToken('not.a.valid.token')).toThrow(/access token/i);
  });
});
