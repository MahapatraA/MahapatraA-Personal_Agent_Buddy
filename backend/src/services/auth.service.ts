import { REFRESH_TOKEN_TTL_SECONDS } from '../config/auth';
import { getDatabase } from '../db/client';
import { conflict, unauthorized } from '../errors/http-error';
import { isUniqueViolation } from '../errors/pg-error';
import { createUser, findUserByEmail, findUserById } from '../repositories/user.repository';
import { createRefreshToken, findRefreshTokenByHash, revokeRefreshTokenIfActive } from '../repositories/refresh-token.repository';
import { User } from '../db/schema';
import { CredentialsInput, RefreshTokenInput } from '../validation/auth';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { generateRefreshToken, hashRefreshToken } from '../utils/refresh-token';

export interface PublicUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email };
}

function refreshTokenExpiry(now: Date): Date {
  return new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000);
}

export async function register(input: CredentialsInput): Promise<AuthSession> {
  const existing = await findUserByEmail(getDatabase(), input.email);

  if (existing !== undefined) {
    throw conflict('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(input.password);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = refreshTokenExpiry(new Date());

  let user: User;

  try {
    user = await getDatabase().transaction(async (tx) => {
      const created = await createUser(tx, { email: input.email, passwordHash });
      await createRefreshToken(tx, { userId: created.id, tokenHash, expiresAt });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict('An account with this email already exists.');
    }

    throw error;
  }

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken
  };
}

async function issueSession(user: User): Promise<AuthSession> {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = refreshTokenExpiry(new Date());

  await createRefreshToken(getDatabase(), { userId: user.id, tokenHash, expiresAt });

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken
  };
}

export async function login(input: CredentialsInput): Promise<AuthSession> {
  const user = await findUserByEmail(getDatabase(), input.email);

  if (user === undefined) {
    throw unauthorized('Invalid email or password.');
  }

  const passwordMatches = await verifyPassword(user.passwordHash, input.password);

  if (!passwordMatches) {
    throw unauthorized('Invalid email or password.');
  }

  return issueSession(user);
}

export async function refresh(input: RefreshTokenInput): Promise<TokenPair> {
  const presentedHash = hashRefreshToken(input.refreshToken);
  const now = new Date();
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);
  const expiresAt = refreshTokenExpiry(now);

  const userId = await getDatabase().transaction(async (tx) => {
    const record = await findRefreshTokenByHash(tx, presentedHash);

    if (
      record === undefined ||
      record.revokedAt !== null ||
      record.expiresAt.getTime() <= now.getTime()
    ) {
      throw unauthorized('Invalid or expired refresh token.');
    }

    const revokedId = await revokeRefreshTokenIfActive(tx, presentedHash, now);

    if (revokedId === undefined) {
      throw unauthorized('Invalid or expired refresh token.');
    }

    const user = await findUserById(tx, record.userId);

    if (user === undefined) {
      throw unauthorized('Invalid or expired refresh token.');
    }

    await createRefreshToken(tx, { userId: user.id, tokenHash: newTokenHash, expiresAt });

    return user.id;
  });

  return {
    accessToken: signAccessToken(userId),
    refreshToken: newRefreshToken
  };
}

export async function logout(input: RefreshTokenInput): Promise<{ message: string }> {
  const tokenHash = hashRefreshToken(input.refreshToken);

  await revokeRefreshTokenIfActive(getDatabase(), tokenHash, new Date());

  return { message: 'Logged out successfully' };
}

export async function getCurrentUser(userId: string): Promise<{ user: PublicUser }> {
  const user = await findUserById(getDatabase(), userId);

  if (user === undefined) {
    throw unauthorized('Authentication required.');
  }

  return { user: toPublicUser(user) };
}
