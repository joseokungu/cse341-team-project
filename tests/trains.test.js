import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

// These tests run against a temporary in-memory MongoDB. tests/setup.js resets it
// to the starter data before every test, so they never touch the shared database.

describe('GET /api/trains', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    // Foundation change: the API now returns a plain array. It used to return
    // an object with a "trains" property.
    expect(response.body).toBeInstanceOf(Array);
  });

  test('returns the trains from the starter data', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(4);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353',
          name: 'Series E353 Limited Express',
          powerSource: 'Electric'
        })
      ])
    );
  });

  test('returns a train added to the test database', async () => {
    await getDb().collection('trains').insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway'
    });

    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-express',
          name: 'Test Express'
        })
      ])
    );
  });
});

// Foundation change: new test. The trains page handler moved into the controller,
// so this checks that the page still renders.
describe('GET /trains', () => {
  test('renders the trains page', async () => {
    const response = await request(app).get('/trains');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});