import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import swaggerDocument from '../swagger.json' with { type: 'json' };

// Verify the Swagger UI and the documented API routes.
describe('API documentation', () => {
  test('serves the Swagger UI page', async () => {
    // The trailing slash matters: /api-docs redirects to /api-docs/.
    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  test('documents the trains API', () => {
    // If this fails after adding a route, run `npm run swagger` and commit the result.
    expect(swaggerDocument.paths).toHaveProperty('/api/trains');
    expect(swaggerDocument.paths['/api/trains']).toHaveProperty('get');
  });

  test('documents the trips API', () => {
    expect(swaggerDocument.paths).toHaveProperty('/api/trips');
    expect(swaggerDocument.paths['/api/trips']).toHaveProperty('get');
    expect(swaggerDocument.paths).toHaveProperty('/api/trips/{id}');
    expect(swaggerDocument.paths['/api/trips/{id}'].get.responses).toHaveProperty('404');
  });
});