import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middleware/error.middleware';

describe('errorHandler', () => {
  it('returns a JSON error response for unexpected errors', async () => {
    const app = express();

    app.get('/boom', () => {
      throw new Error('Unexpected failure');
    });

    app.use(errorHandler);

    const response = await request(app).get('/boom');

    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          status: 500,
          message: 'Unexpected failure'
        })
      })
    );
  });
});
