import { inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app';
import { closeDatabase, getDatabase } from '../../src/db/client';
import { refreshTokens, users } from '../../src/db/schema';
import { findRefreshTokenByHash } from '../../src/repositories/refresh-token.repository';
import { getJwtSecret } from '../../src/utils/jwt';
import { generateRefreshToken, hashRefreshToken } from '../../src/utils/refresh-token';

const databaseUrl = process.env.DATABASE_URL;
const PASSWORD = 'StrongPassword123!';
const createdEmails = new Set<string>();

function uniqueEmail(): string {
  return `it-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

async function registerUser(email = uniqueEmail()): Promise<{
  email: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
}> {
  const response = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  createdEmails.add(email);

  expect(response.status).toBe(201);

  return {
    email,
    userId: response.body.user.id,
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken
  };
}

describe.runIf(Boolean(databaseUrl))('Auth API', () => {
  afterEach(async () => {
    if (createdEmails.size === 0) {
      return;
    }

    const emails = [...createdEmails];
    createdEmails.clear();
    await getDatabase().delete(users).where(inArray(users.email, emails));
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('registers a user and returns a session without exposing hashes', async () => {
      const email = uniqueEmail();
      createdEmails.add(email);

      const response = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });

      expect(response.status).toBe(201);
      expect(response.body.user).toEqual({ id: expect.any(String), email });
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
      expect(JSON.stringify(response.body)).not.toContain(PASSWORD);
    });

    it('rejects a duplicate email regardless of casing', async () => {
      const email = uniqueEmail();
      await registerUser(email);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: email.toUpperCase(), password: PASSWORD });

      expect(response.status).toBe(409);
    });

    it('rejects an invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: PASSWORD });

      expect(response.status).toBe(400);
    });

    it('rejects a weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: uniqueEmail(), password: 'short' });

      expect(response.status).toBe(400);
    });

    it('rejects a malformed body', async () => {
      const response = await request(app).post('/api/auth/register').send({ email: uniqueEmail() });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials and returns usable tokens', async () => {
      const account = await registerUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: account.email, password: PASSWORD });

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(account.userId);
      expect(response.body.refreshToken).toEqual(expect.any(String));

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${response.body.accessToken}`);

      expect(me.status).toBe(200);
      expect(me.body.user.id).toBe(account.userId);
    });

    it('returns a generic error for an incorrect password', async () => {
      const account = await registerUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: account.email, password: 'WrongPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('Invalid email or password.');
    });

    it('returns the same generic error for a nonexistent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: uniqueEmail(), password: PASSWORD });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the authenticated user for a valid token', async () => {
      const account = await registerUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${account.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({ id: account.userId, email: account.email });
    });

    it('rejects a missing token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('rejects a malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.token');

      expect(response.status).toBe(401);
    });

    it('rejects a token with an invalid signature', async () => {
      const forged = jwt.sign({ sub: '11111111-1111-4111-8111-111111111111' }, 'wrong-secret', {
        algorithm: 'HS256',
        expiresIn: 60
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forged}`);

      expect(response.status).toBe(401);
    });

    it('rejects an expired token', async () => {
      const expired = jwt.sign(
        { sub: '11111111-1111-4111-8111-111111111111' },
        getJwtSecret(),
        { algorithm: 'HS256', expiresIn: -10 }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expired}`);

      expect(response.status).toBe(401);
    });

    it('rejects a token for a user that no longer exists', async () => {
      const orphan = jwt.sign(
        { sub: '99999999-9999-4999-8999-999999999999' },
        getJwtSecret(),
        { algorithm: 'HS256', expiresIn: 60 }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${orphan}`);

      expect(response.status).toBe(401);
    });

    it('cannot be switched to another user via request body fields', async () => {
      const first = await registerUser();
      const second = await registerUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${first.accessToken}`)
        .send({ userId: second.userId, id: second.userId });

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(first.userId);
      expect(response.body.user.id).not.toBe(second.userId);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rotates a valid refresh token and issues a usable access token', async () => {
      const account = await registerUser();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: account.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.refreshToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).not.toBe(account.refreshToken);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${response.body.accessToken}`);

      expect(me.status).toBe(200);
      expect(me.body.user.id).toBe(account.userId);
    });

    it('persists the rotation and invalidates the previous token', async () => {
      const account = await registerUser();

      const rotated = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: account.refreshToken });

      expect(rotated.status).toBe(200);

      const oldRecord = await findRefreshTokenByHash(getDatabase(), hashRefreshToken(account.refreshToken));
      const newRecord = await findRefreshTokenByHash(
        getDatabase(),
        hashRefreshToken(rotated.body.refreshToken)
      );

      expect(oldRecord?.revokedAt).not.toBeNull();
      expect(newRecord?.revokedAt).toBeNull();

      const reuse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: account.refreshToken });

      expect(reuse.status).toBe(401);
    });

    it('rejects an expired refresh token using the database expiry', async () => {
      const account = await registerUser();
      const token = generateRefreshToken();

      await getDatabase()
        .insert(refreshTokens)
        .values({
          userId: account.userId,
          tokenHash: hashRefreshToken(token),
          expiresAt: new Date(Date.now() - 1000)
        });

      const response = await request(app).post('/api/auth/refresh').send({ refreshToken: token });

      expect(response.status).toBe(401);
    });

    it('rejects a revoked refresh token', async () => {
      const account = await registerUser();

      await request(app).post('/api/auth/logout').send({ refreshToken: account.refreshToken });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: account.refreshToken });

      expect(response.status).toBe(401);
    });

    it('rejects a nonexistent refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: generateRefreshToken() });

      expect(response.status).toBe(401);
    });

    it('rejects a malformed refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'not-a-real-token' });

      expect(response.status).toBe(401);
    });

    it('rejects a body without a refresh token', async () => {
      const response = await request(app).post('/api/auth/refresh').send({});

      expect(response.status).toBe(400);
    });

    it('allows only one of two concurrent rotations of the same token', async () => {
      const account = await registerUser();

      const [first, second] = await Promise.all([
        request(app).post('/api/auth/refresh').send({ refreshToken: account.refreshToken }),
        request(app).post('/api/auth/refresh').send({ refreshToken: account.refreshToken })
      ]);

      const statuses = [first.status, second.status].sort();

      expect(statuses).toEqual([200, 401]);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes a refresh token and reports success', async () => {
      const account = await registerUser();

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: account.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('is idempotent for repeated and unknown tokens', async () => {
      const account = await registerUser();

      const first = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: account.refreshToken });
      const second = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: account.refreshToken });
      const unknown = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: generateRefreshToken() });

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(unknown.status).toBe(200);
    });
  });
});
