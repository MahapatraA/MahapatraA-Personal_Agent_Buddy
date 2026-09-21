import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../config/auth';
import { badRequest } from '../errors/http-error';

export interface CredentialsInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFRESH_TOKEN_MAX_LENGTH = 512;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readEmail(body: Record<string, unknown>): string {
  const value = body.email;

  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest('A valid email address is required.');
  }

  const email = normalizeEmail(value);

  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw badRequest('A valid email address is required.');
  }

  return email;
}

function readPassword(body: Record<string, unknown>, mode: 'register' | 'login'): string {
  const value = body.password;

  if (typeof value !== 'string' || value.length === 0) {
    throw badRequest('A password is required.');
  }

  if (mode === 'register') {
    if (
      value.length < PASSWORD_MIN_LENGTH ||
      value.length > PASSWORD_MAX_LENGTH ||
      !/[A-Za-z]/.test(value) ||
      !/[0-9]/.test(value)
    ) {
      throw badRequest(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include both letters and numbers.`
      );
    }
  }

  return value;
}

export function parseCredentialsBody(body: unknown, mode: 'register' | 'login'): CredentialsInput {
  if (!isRecord(body)) {
    throw badRequest('A valid JSON request body is required.');
  }

  return {
    email: readEmail(body),
    password: readPassword(body, mode)
  };
}

export function parseRefreshTokenBody(body: unknown): RefreshTokenInput {
  if (!isRecord(body)) {
    throw badRequest('A valid JSON request body is required.');
  }

  const value = body.refreshToken;

  if (typeof value !== 'string' || value.trim() === '' || value.length > REFRESH_TOKEN_MAX_LENGTH) {
    throw badRequest('A refresh token is required.');
  }

  return { refreshToken: value };
}
