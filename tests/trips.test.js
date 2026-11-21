import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trips', () => {
  test('returns a JSON array of trips', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
  });

  test('returns the trips from the starter data', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(6);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alpine-panorama',
          name: 'Alpine Panorama Express',
          region: 'central',
          bestSeason: 'autumn',
          distance: 180
        })
      ])
    );
  });

  test('returns trips added to the database', async () => {
    await getDb().collection('trips').insertOne({
      id: 'test-line',
      name: 'Test Line',
      region: 'central'
    });

    const response = await request(app).get('/api/trips');

    expect(response.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'test-line' })])
    );
  });
});

describe('GET /api/trips/:id', () => {
  test('returns one trip by ID', async () => {
    const response = await request(app).get('/api/trips/sakura-valley');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toMatchObject({
      id: 'sakura-valley',
      name: 'Sakura Valley Limited',
      region: 'kansai'
    });
    expect(response.body.highlights).toBeInstanceOf(Array);
    expect(response.body.operatingMonths).toBeInstanceOf(Array);
  });

  test('returns 404 for an unknown trip ID', async () => {
    const response = await request(app).get('/api/trips/not-a-real-trip');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Trip not found' });
  });
});

describe('GET /trips', () => {
  test('renders the list shell for client-side hydration', async () => {
    const response = await request(app).get('/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('id="trips-list"');
    expect(response.text).toContain('id="trip-card-template"');
    expect(response.text).not.toContain('Alpine Panorama Express');
  });
});

describe('GET /trips/:tripId', () => {
  test('renders trip details and schedules', async () => {
    const response = await request(app).get('/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('Alpine Panorama Express');
    expect(response.text).toContain('Available Schedules');
  });

  test('renders the 404 page for an unknown trip', async () => {
    const response = await request(app).get('/trips/not-a-real-trip');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
