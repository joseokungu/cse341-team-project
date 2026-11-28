// Adds the standard roles ("customer" and "admin") to the database in .env without
// touching any other data. Safe to run more than once, including on the shared
// database and runs with `npm run db:seed-roles`.
import { closeDb, connectToDb } from './connect.js';
import { seedRoles } from './initialize.js';

try {
  const db = await connectToDb();
  await seedRoles(db);
  console.log('Standard roles are in the database.');
} finally {
  await closeDb();
}