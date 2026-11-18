// Database connection helper.
//
// Foundation change: this file used to create its own MongoClient. It now connects
// through Mongoose instead, because the schemas and models (src/models/schemas/*.js,
// src/models/*.js) use Mongoose and need an active Mongoose connection.
//
// The exports and their signatures are unchanged (connectToDb, getDb, closeDb), so
// server.js, src/db/import.js, and tests/setup.js keep working without edits.
import mongoose from 'mongoose';

// Mongoose reports a connection state number. 1 means "connected".
const CONNECTED = 1;

const isConnected = () => {
  return mongoose.connection.readyState === CONNECTED;
};

// Returns the native MongoDB database object that sits underneath the Mongoose
// connection. Code that still calls getDb().collection('name') directly (for
// example src/db/initialize.js and the trip route files) keeps working, and it
// shares one connection with the Mongoose models.
const getDb = () => {
  if (!isConnected()) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }
  return mongoose.connection.db;
};

const connectToDb = async (options = {}) => {
  // Calling this more than once returns the existing connection.
  if (isConnected()) {
    return getDb();
  }

  // Options win over environment variables. The tests pass their own values.
  const connectionString = options.connectionString || process.env.MONGODB_URI;
  const databaseName = options.databaseName || process.env.MONGODB_DB_NAME || 'practice';

  if (!connectionString) {
    throw new Error('MONGODB_URI is required.');
  }

  // dbName tells Mongoose which database to use on the server.
  await mongoose.connect(connectionString, { dbName: databaseName });
  return getDb();
};

// Used by the import script and by the tests to disconnect cleanly.
const closeDb = async () => {
  await mongoose.disconnect();
};

export { closeDb, connectToDb, getDb };