
import { describe, expect, test, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import schedule from '../src/models/schemas/schedules.js';

// Tests use the temporary MongoDB database configured in tests/setup.js.
// The starter data is restored before each test.

describe('GET /api/trips/:id/schedules', () => {
  test('returns schedules for an existing trip', async () => {
    const response = await request(app)
      .get('/api/trips/alpine-panorama/schedules');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          tripId: 'alpine-panorama',
          departureTime: '08:30',
          arrivalTime: '13:00',
          status: true
        })
      ])
    );
  });

  test('returns schedules for an operating month', async () => {
    const response = await request(app)
      .get('/api/trips/alpine-panorama/schedules?month=5');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test('returns an empty array outside operating months', async () => {
    const response = await request(app)
      .get('/api/trips/alpine-panorama/schedules?month=12');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test.each(['0', '13', 'abc', '1.5'])(
    'returns 400 for invalid month %s',
    async (month) => {
      const response = await request(app)
        .get(`/api/trips/alpine-panorama/schedules?month=${month}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'month must be a whole number from 1 through 12'
      });
    }
  );

  test('returns 404 when the trip does not exist', async () => {
    const response = await request(app)
      .get('/api/trips/nonexistent-trip/schedules');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Trip not found'
    });
  });

  test('returns 404 for a nonexistent trip with a month', async () => {
    const response = await request(app)
      .get('/api/trips/nonexistent-trip/schedules?month=5');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Trip not found'
    });
  });

  test('returns a schedule added to the test database', async () => {
    await getDb().collection('schedules').insertOne({
      id: 99,
      tripId: 'alpine-panorama',
      departureTime: '18:00',
      arrivalTime: '22:00',
      daysOfWeek: ['monday'],
      status: true
    });

    const response = await request(app)
      .get('/api/trips/alpine-panorama/schedules');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 99,
          departureTime: '18:00'
        })
      ])
    );
  });

  test('returns 500 when fetching schedules fails', async () => {
    const findSpy = vi.spyOn(schedule, 'find').mockImplementation(() => {
      throw new Error('Simulated database failure');
    });

    try {
      const response = await request(app)
        .get('/api/trips/alpine-panorama/schedules');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch schedules'
      });
    } finally {
      findSpy.mockRestore();
    }
  });
});

describe('GET /trips/:tripId', () => {
  test('renders the trip details page', async () => {
    const response = await request(app)
      .get('/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('id="trip-schedules"');
    expect(response.text).toContain('id="schedule-month"');
    expect(response.text).toContain('id="schedule-card-template"');
  });
});
