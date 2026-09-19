import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('GET /api/health', () => {
  it('returns HTTP 200', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
  });

  it('returns the expected JSON structure', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        environment: expect.any(String),
        timestamp: expect.any(String)
      })
    );
  });
});

describe('unknown route', () => {
  it('returns HTTP 404 with a JSON error response', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          status: 404,
          message: expect.any(String)
        })
      })
    );
  });
});
