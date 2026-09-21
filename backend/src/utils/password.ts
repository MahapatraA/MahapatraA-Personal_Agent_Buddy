import { argon2id, hash, verify } from 'argon2';

const ARGON2_OPTIONS: {
  type: 0 | 1 | 2;
  memoryCost: number;
  timeCost: number;
  parallelism: number;
} = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
