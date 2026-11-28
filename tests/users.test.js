import { describe, expect, test } from 'vitest';
import {
  createUser,
  findUserByEmail,
  verifyPassword
} from '../src/models/users.js';

describe('user model', () => {
  test('creates a customer with a hashed password and finds them by email', async () => {
    const password = 'correct-horse-battery-staple';
    const user = await createUser({
      name: 'Test User',
      email: 'TEST@example.com',
      password
    });

    expect(user.passwordHash).not.toBe(password);
    expect(await verifyPassword(password, user.passwordHash)).toBe(true);

    const foundUser = await findUserByEmail('test@example.com');
    expect(foundUser.name).toBe('Test User');
    expect(foundUser.role.name).toBe('customer');
  });

  test('returns null when the email is not registered', async () => {
    await expect(findUserByEmail('missing@example.com')).resolves.toBeNull();
  });

  test('rejects an incorrect password', async () => {
    const user = await createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'correct-password'
    });

    await expect(verifyPassword('incorrect-password', user.passwordHash))
      .resolves.toBe(false);
  });
});
