import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createTestUser, signIn } from './helpers/auth.js';

describe('User Dashboard and Navigation', () => {
  test('redirects signed-out visitors to login', async () => {
    const response = await request(app).get('/dashboard');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('shows registration and login links when signed out', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('href="/register"');
    expect(response.text).toContain('href="/login"');
    expect(response.text).not.toContain('href="/logout"');
    expect(response.text).not.toContain('href="/dashboard"');
    expect(response.text).not.toContain('href="/admin-dashboard"');
  });

  test('redirects customers to their dashboard after login', async () => {
    const user = await createTestUser({ role: 'customer' });
    const agent = request.agent(app);
    const response = await signIn(agent, user);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/dashboard');
  });

  test('displays the signed-in customer name', async () => {
    const user = await createTestUser({
      role: 'customer',
      displayName: 'Dashboard Customer'
    });

    const agent = request.agent(app);
    await signIn(agent, user);

    const response = await agent.get('/dashboard');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Welcome, Dashboard Customer!');
    expect(response.text).toContain('My Bookings');
  });

  test('shows customer navigation when signed in', async () => {
    const user = await createTestUser({ role: 'customer' });
    const agent = request.agent(app);

    await signIn(agent, user);

    const response = await agent.get('/dashboard');

    expect(response.status).toBe(200);
    expect(response.text).toContain('href="/dashboard"');
    expect(response.text).toContain('href="/logout"');
    expect(response.text).not.toContain('href="/register"');
    expect(response.text).not.toContain('href="/login"');
  });

  test('includes the required management links', async () => {
    const user = await createTestUser();
    const agent = request.agent(app);

    await signIn(agent, user);

    const response = await agent.get('/dashboard');

    expect(response.status).toBe(200);
    expect(response.text).toContain('href="/bookings-admin"');
    expect(response.text).toContain('href="/users-admin"');
  });

  test('redirects administrators to the admin dashboard', async () => {
    const user = await createTestUser({ role: 'admin' });
    const agent = request.agent(app);

    const response = await signIn(agent, user);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin-dashboard');
  });

  test('shows administrator dashboard navigation', async () => {
    const user = await createTestUser({ role: 'admin' });
    const agent = request.agent(app);

    await signIn(agent, user);

    const response = await agent.get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('href="/admin-dashboard"');
    expect(response.text).toContain('href="/logout"');
    expect(response.text).not.toContain('href="/dashboard"');
    expect(response.text).not.toContain('href="/register"');
    expect(response.text).not.toContain('href="/login"');
  });

  test('protects the dashboard after logout', async () => {
    const user = await createTestUser();
    const agent = request.agent(app);

    await signIn(agent, user);
    await agent.get('/logout');

    const response = await agent.get('/dashboard');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test.each([
    ['/404', 404],
    ['/500', 500]
  ])('renders %s while signed out', async (path, status) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(status);
    expect(response.text).toContain('href="/login"');
    expect(response.text).toContain('href="/register"');
  });
});