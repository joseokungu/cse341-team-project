import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { findUserByEmail } from '../src/models/users.js';

describe('GET /register', () => {
  test('renders the registration form', async () => {
    const response = await request(app).get('/register');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('action="/register"');
    expect(response.text).toContain('name="name"');
    expect(response.text).toContain('name="email"');
    expect(response.text).toContain('name="password"');
  });
});

describe('GET /login', () => {
  test('renders the login form', async () => {
    const response = await request(app).get('/login');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('action="/login"');
    expect(response.text).toContain('name="email"');
    expect(response.text).toContain('name="password"');
  });
});

describe('POST /register', () => {
  test('creates an account with a hashed password and redirects to login', async () => {
    const response = await request(app)
      .post('/register')
      .type('form')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secure-password'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');

    const user = await findUserByEmail('test@example.com');
    expect(user.name).toBe('Test User');
    expect(user.passwordHash).not.toBe('secure-password');
  });

  test('rejects duplicate email addresses', async () => {
    await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'First User', email: 'test@example.com', password: 'password' });

    const response = await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'Second User', email: 'test@example.com', password: 'password' });

    expect(response.status).toBe(409);
    expect(response.text).toContain('An account with that email already exists.');
  });
});

describe('POST /login and POST /logout', () => {
  test('stores user identity in the session and clears it on logout', async () => {
    const agent = request.agent(app);

    await agent
      .post('/register')
      .type('form')
      .send({ name: 'Test User', email: 'test@example.com', password: 'secure-password' });

    const loginResponse = await agent
      .post('/login')
      .type('form')
      .send({ email: 'test@example.com', password: 'secure-password' });

    expect(loginResponse.status).toBe(302);
    expect(loginResponse.headers.location).toBe('/');

    const homeResponse = await agent.get('/');
    expect(homeResponse.text).toContain('Test User (customer)');

    const logoutResponse = await agent.post('/logout');
    expect(logoutResponse.status).toBe(302);
    expect(logoutResponse.headers.location).toBe('/login');

    const loggedOutHomeResponse = await agent.get('/');
    expect(loggedOutHomeResponse.text).not.toContain('Test User (customer)');
    expect(loggedOutHomeResponse.text).toContain('href="/login"');
  });

  test('rejects an incorrect password', async () => {
    await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'Test User', email: 'test@example.com', password: 'secure-password' });

    const response = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.text).toContain('Invalid email or password.');
  });
});
