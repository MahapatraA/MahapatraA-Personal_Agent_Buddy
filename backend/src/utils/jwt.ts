import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { ACCESS_TOKEN_TTL_SECONDS } from '../config/auth';
import { unauthorized } from '../errors/http-error';

const JWT_ALGORITHM = 'HS256';

export function getJwtSecret(): string {
  if (env.jwtSecret === undefined) {
    throw new Error('JWT_SECRET is not configured. Set it to sign and verify access tokens.');
  }

  return env.jwtSecret;
}

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS
  });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function verifyAccessToken(token: string): AccessTokenPayload {
  let payload: string | JwtPayload;

  try {
    payload = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
  } catch {
    throw unauthorized('Invalid or expired access token.');
  }

  if (typeof payload === 'string' || typeof payload.sub !== 'string' || !UUID_PATTERN.test(payload.sub)) {
    throw unauthorized('Invalid or expired access token.');
  }

  return payload as AccessTokenPayload;
}
