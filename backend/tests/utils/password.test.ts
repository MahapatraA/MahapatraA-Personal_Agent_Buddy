import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('password hashing', () => {
  it('produces an argon2id hash that is not the plaintext password', async () => {
    const password = 'StrongPassword123!';
    const digest = await hashPassword(password);

    expect(digest).not.toBe(password);
    expect(digest.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies the correct password', async () => {
    const digest = await hashPassword('StrongPassword123!');

    await expect(verifyPassword(digest, 'StrongPassword123!')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const digest = await hashPassword('StrongPassword123!');

    await expect(verifyPassword(digest, 'WrongPassword123!')).resolves.toBe(false);
  });

  it('returns false for a malformed hash instead of throwing', async () => {
    await expect(verifyPassword('not-a-valid-hash', 'StrongPassword123!')).resolves.toBe(false);
  });
});
