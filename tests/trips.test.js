import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
  test('returns the trips from the starter data', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.trips).toHaveLength(6);
    expect(response.body.trips).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alpine-panorama',
          name: 'Alpine Panorama Express'
        })
      ])
    );
  });
});

describe('GET /trips', () => {
  test('serves the trip list shell for client-side hydration', async () => {
    const response = await request(app).get('/trips');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="trips-list"');
    expect(response.text).toContain('id="trip-card-template"');
    expect(response.text).not.toContain('Alpine Panorama Express');
  });
});
