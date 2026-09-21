import { createHash, randomBytes } from 'node:crypto';
import { REFRESH_TOKEN_BYTES } from '../config/auth';

export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
