// Helpers for tests that need a signed-in user. Use them instead of going through the
// register form each time.
//
//   const user = await createTestUser({ role: 'admin' });
//   const agent = request.agent(app);          // an agent keeps the session cookie
//   await signIn(agent, user);
//   const response = await agent.get('/admin-dashboard');
import bcrypt from 'bcryptjs';
import { getDb } from '../../src/db/connect.js';

export const TEST_PASSWORD = 'correct-horse-battery';

let counter = 0;

// Inserts a user straight into the test database (bypassing registration), so a test
// can create an admin. The role must be 'customer' or 'admin'. Returns the user with
// the plain `password` so the test can sign in.
export async function createTestUser({
  role = 'customer',
  displayName,
  username,
  email,
  password = TEST_PASSWORD
} = {}) {
  counter += 1;

  const db = getDb();
  const roleDocument = await db.collection('roles').findOne({ name: role });

  if (!roleDocument) {
    throw new Error(`Role "${role}" was not found in the test database.`);
  }

  const user = {
    displayName: displayName ?? `Test User ${counter}`,
    username: username ?? `testuser${counter}`,
    email: email ?? `testuser${counter}@example.com`,
    // A low cost keeps the tests fast. The app itself uses a higher one.
    passwordHash: await bcrypt.hash(password, 4),
    role: roleDocument._id,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const { insertedId } = await db.collection('users').insertOne(user);

  return { ...user, _id: insertedId, password };
}

// Signs the agent in through the real login form and returns the response.
export async function signIn(agent, user) {
  return agent.post('/login').type('form').send({
    email: user.email,
    password: user.password
  });
}