import trips from './seeds/trips.json' with { type: 'json' };
import schedules from './seeds/schedules.json' with { type: 'json' };
import stations from './seeds/stations.json' with { type: 'json' };
import ticketClasses from './seeds/ticket-classes.json' with { type: 'json' };
import trains from './seeds/trains.json' with { type: 'json' };

const starterCollections = [
  ['trips', trips],
  ['schedules', schedules],
  ['stations', stations],
  ['ticketClasses', ticketClasses],
  ['trains', trains]
];

// The standard roles. Users reference a role by id, and the code looks roles up by name.
const standardRoles = [
  { name: 'customer', description: 'A signed-in customer' },
  { name: 'admin', description: 'An administrator' }
];

// Makes sure the standard roles exist. Each one is upserted by name, so running this
// again never creates a second copy and never changes an existing role's id. (If roles
// were deleted and re-inserted like the starter collections, every user's `role`
// reference would point at a role that no longer exists.)
const seedRoles = async (db) => {
  const roles = db.collection('roles');

  await roles.createIndex({ name: 1 }, { unique: true });

  for (const role of standardRoles) {
    await roles.updateOne(
      { name: role.name },
      { $setOnInsert: role },
      { upsert: true }
    );
  }
};

const initializeDatabase = async (db) => {
  if (!db) {
    throw new Error('A database connection is required to initialize data.');
  }

  for (const [collectionName, documents] of starterCollections) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    await collection.insertMany(documents);
  }

  const bookings = db.collection('bookings');
  await bookings.deleteMany({});
  await bookings.createIndex({ id: 1 }, { unique: true });

  // Roles are seeded, never wiped. Users are not touched either, but their unique
  // indexes are created so duplicate emails and usernames are always rejected.
  await seedRoles(db);

  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ username: 1 }, { unique: true });
};

export { initializeDatabase, seedRoles, standardRoles, starterCollections };