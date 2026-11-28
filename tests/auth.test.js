import { afterEach, describe, expect, test, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';
import { createTestUser, signIn } from './helpers/auth.js';

// These tests run against the temporary in-memory database that tests/setup.js resets
// before every test. Each test signs in through a Supertest agent, which keeps the
// session cookie between requests.

const validRegistration = {
  displayName: 'Ada Lovelace',
  username: 'ada_l',
  email: 'ada@example.com',
  password: 'a-long-password',
  confirmPassword: 'a-long-password'
};

const register = (agent, overrides = {}) => {
  return agent.post('/register').type('form').send({ ...validRegistration, ...overrides });
};

const countUsers = () => getDb().collection('users').countDocuments({});

// The "connect.sid=..." part of a response's Set-Cookie header.
const sessionCookie = (response) => {
  const header = (response.headers['set-cookie'] || []).find((cookie) => {
    return cookie.startsWith('connect.sid=');
  });

  return header ? header.split(';')[0] : undefined;
};

describe('standard roles', () => {
  test('the customer and admin roles exist', async () => {
    const roles = await getDb().collection('roles').find({}).toArray();

    expect(roles.map((role) => role.name).sort()).toEqual(['admin', 'customer']);
  });

  test('seeding again keeps the same role ids', async () => {
    const before = await getDb().collection('roles').find({}).toArray();

    await initializeDatabase(getDb());

    const after = await getDb().collection('roles').find({}).toArray();

    expect(after).toHaveLength(2);
    expect(after.map((role) => String(role._id)).sort()).toEqual(
      before.map((role) => String(role._id)).sort()
    );
  });
});

describe('GET /register and GET /login', () => {
  test.each(['/register', '/login'])('%s shows a form and sets no cookie', async (path) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain(`action="${path}"`);
    // Visitors who never sign in do not get a session.
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});

describe('POST /register', () => {
  test('creates a customer, signs them in, and redirects', async () => {
    const response = await register(request.agent(app));

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');

    const cookie = response.headers['set-cookie'].join(';');
    expect(cookie).toContain('connect.sid=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');

    const user = await getDb().collection('users').findOne({ username: 'ada_l' });
    const customer = await getDb().collection('roles').findOne({ name: 'customer' });

    expect(user.email).toBe('ada@example.com');
    expect(String(user.role)).toBe(String(customer._id));
  });

  test('stores only a bcrypt hash of the password', async () => {
    await register(request.agent(app));

    const user = await getDb().collection('users').findOne({ username: 'ada_l' });

    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(user.passwordHash).not.toContain(validRegistration.password);
    expect(user).not.toHaveProperty('password');
  });

  test('ignores a submitted role and always creates a customer', async () => {
    const adminRole = await getDb().collection('roles').findOne({ name: 'admin' });
    const response = await register(request.agent(app), {
      role: 'admin',
      roleId: String(adminRole._id)
    });

    expect(response.status).toBe(302);

    const user = await getDb().collection('users').findOne({ username: 'ada_l' });
    const customer = await getDb().collection('roles').findOne({ name: 'customer' });

    expect(String(user.role)).toBe(String(customer._id));
    expect(response.headers.location).toBe('/');
  });

  test('stores the email and username in lowercase', async () => {
    await register(request.agent(app), { email: ' ADA@Example.COM ', username: 'Ada_L' });

    const user = await getDb().collection('users').findOne({ username: 'ada_l' });

    expect(user.email).toBe('ada@example.com');
  });

  test('leaves the new user signed in', async () => {
    const agent = request.agent(app);

    await register(agent);

    // A signed-in user is sent away from the login page.
    const response = await agent.get('/login');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  test.each([
    ['a missing display name', { displayName: '' }],
    ['a username with spaces', { username: 'ada l' }],
    ['a username that is too short', { username: 'ad' }],
    ['an invalid email', { email: 'not-an-email' }],
    ['a short password', { password: 'short', confirmPassword: 'short' }],
    ['a password over 72 bytes', { password: 'a'.repeat(73), confirmPassword: 'a'.repeat(73) }],
    ['mismatched passwords', { confirmPassword: 'something-else-entirely' }]
  ])('rejects %s with 400 and saves nothing', async (label, overrides) => {
    const response = await register(request.agent(app), overrides);

    expect(response.status).toBe(400);
    expect(response.text).toContain('auth-errors');
    expect(await countUsers()).toBe(0);
  });

  test('rejects an object sent instead of a string', async () => {
    const response = await request(app)
      .post('/register')
      .type('form')
      .send('displayName=Ada&username=ada_l&email[$ne]=x&password=a-long-password&confirmPassword=a-long-password');

    expect(response.status).toBe(400);
    expect(response.text).toContain('Enter a valid email address.');
    expect(await countUsers()).toBe(0);
  });

  test('rejects a request with no body', async () => {
    const response = await request(app).post('/register');

    expect(response.status).toBe(400);
    expect(await countUsers()).toBe(0);
  });

  test('never sends the password back to the page', async () => {
    const response = await register(request.agent(app), {
      email: 'not-an-email',
      password: 'secret-value-123',
      confirmPassword: 'secret-value-123'
    });

    expect(response.status).toBe(400);
    expect(response.text).not.toContain('secret-value-123');
  });

  test('escapes what the visitor typed when the form is shown again', async () => {
    const response = await register(request.agent(app), {
      displayName: '<script>alert(1)</script>',
      email: 'not-an-email'
    });

    expect(response.status).toBe(400);
    expect(response.text).toContain('&lt;script&gt;');
    expect(response.text).not.toContain('<script>alert(1)');
  });

  test('rejects a duplicate email with 409', async () => {
    await register(request.agent(app));

    const response = await register(request.agent(app), { username: 'someone_else' });

    expect(response.status).toBe(409);
    expect(response.text).toContain('already exists');
    expect(await countUsers()).toBe(1);
  });

  test('rejects a duplicate username with 409', async () => {
    await register(request.agent(app));

    const response = await register(request.agent(app), { email: 'other@example.com' });

    expect(response.status).toBe(409);
    expect(await countUsers()).toBe(1);
  });
});

describe('POST /login', () => {
  test('signs a customer in and redirects to the home page', async () => {
    const user = await createTestUser({ role: 'customer' });

    const response = await signIn(request.agent(app), user);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(sessionCookie(response)).toBeDefined();
  });

  test('signs an admin in and redirects to the admin dashboard', async () => {
    const user = await createTestUser({ role: 'admin' });

    const response = await signIn(request.agent(app), user);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin-dashboard');
  });

  test('accepts the email in any letter case', async () => {
    const user = await createTestUser({ email: 'mixed@example.com' });

    const response = await signIn(request.agent(app), { ...user, email: 'MIXED@Example.com' });

    expect(response.status).toBe(302);
  });

  test('gives the same 401 message for a wrong password and an unknown email', async () => {
    const user = await createTestUser();

    const wrongPassword = await signIn(request.agent(app), { ...user, password: 'wrong-password-1' });
    const unknownEmail = await signIn(request.agent(app), {
      email: 'nobody@example.com',
      password: user.password
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.text).toContain('Invalid email or password.');
    expect(unknownEmail.text).toContain('Invalid email or password.');
    expect(sessionCookie(wrongPassword)).toBeUndefined();
    expect(sessionCookie(unknownEmail)).toBeUndefined();
  });

  test('rejects missing fields with 400', async () => {
    const response = await request(app).post('/login').type('form').send({ email: '' });

    expect(response.status).toBe(400);
  });

  test('rejects an object sent instead of a string', async () => {
    const response = await request(app)
      .post('/login')
      .type('form')
      .send('email[$ne]=x&password[$ne]=y');

    expect(response.status).toBe(400);
  });

  test('issues a new session id on every login', async () => {
    const user = await createTestUser();
    const agent = request.agent(app);

    const first = sessionCookie(await signIn(agent, user));
    const second = sessionCookie(await signIn(agent, user));

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(second).not.toBe(first);
  });
});

describe('GET /logout', () => {
  test('ends the session on the server', async () => {
    const user = await createTestUser();
    const agent = request.agent(app);
    const cookie = sessionCookie(await signIn(agent, user));

    const response = await agent.get('/logout');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');

    // The agent is signed out, so the login page shows again.
    expect((await agent.get('/login')).status).toBe(200);

    // The old cookie no longer works, even if someone kept a copy of it.
    const replay = await request(app).get('/login').set('Cookie', cookie);

    expect(replay.status).toBe(200);
  });
});

describe('session secret', () => {
  const saved = { secret: process.env.SESSION_SECRET, env: process.env.NODE_ENV };

  afterEach(() => {
    if (saved.secret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = saved.secret;
    }

    process.env.NODE_ENV = saved.env;
  });

  test('the app refuses to load without SESSION_SECRET outside of tests', async () => {
    vi.resetModules();
    delete process.env.SESSION_SECRET;
    process.env.NODE_ENV = 'production';

    await expect(import('../src/middleware/session.js')).rejects.toThrow(
      'SESSION_SECRET is required'
    );
  });
});