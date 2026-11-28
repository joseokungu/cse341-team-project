import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import globalMiddleware from '../src/middleware/global.js';
import {
  requireApiLogin,
  requireApiRole,
  requirePageLogin,
  requirePageRole
} from '../src/middleware/auth.js';

const createTestApp = () => {
  const app = express();
  app.use(session({
    secret: 'auth-middleware-test-secret',
    resave: false,
    saveUninitialized: false
  }));
  app.use(globalMiddleware);
  app.set('view engine', 'ejs');
  app.set('views', fileURLToPath(new URL('../src/views', import.meta.url)));

  app.get('/test-session/:role', (req, res) => {
    req.session.userId = 'test-user';
    req.session.role = req.params.role;
    return res.sendStatus(204);
  });
  app.get('/api/login-required', requireApiLogin(), (_req, res) => res.sendStatus(200));
  app.get('/page/login-required', requirePageLogin(), (_req, res) => res.sendStatus(200));
  app.get('/api/admin', requireApiRole('admin'), (_req, res) => res.sendStatus(200));
  app.get('/page/admin', requirePageRole('admin'), (_req, res) => res.sendStatus(200));

  return app;
};

describe('authentication middleware', () => {
  test('returns an API 401 and redirects unauthenticated page requests', async () => {
    const app = createTestApp();
    const apiResponse = await request(app).get('/api/login-required');
    const pageResponse = await request(app).get('/page/login-required');

    expect(apiResponse.status).toBe(401);
    expect(apiResponse.body).toEqual({ error: 'Authentication required' });
    expect(pageResponse.status).toBe(302);
    expect(pageResponse.headers.location).toBe('/login');
  });

  test('allows matching roles and denies mismatched roles for API and page requests', async () => {
    const app = createTestApp();
    const adminAgent = request.agent(app);
    await adminAgent.get('/test-session/admin');

    const adminApiResponse = await adminAgent.get('/api/admin');
    const adminPageResponse = await adminAgent.get('/page/admin');
    expect(adminApiResponse.status).toBe(200);
    expect(adminPageResponse.status).toBe(200);

    const customerAgent = request.agent(app);
    await customerAgent.get('/test-session/customer');

    const customerApiResponse = await customerAgent.get('/api/admin');
    const customerPageResponse = await customerAgent.get('/page/admin');
    expect(customerApiResponse.status).toBe(403);
    expect(customerApiResponse.body).toEqual({ error: 'Forbidden' });
    expect(customerPageResponse.status).toBe(403);
    expect(customerPageResponse.text).toContain('Access Denied');
  });
});
