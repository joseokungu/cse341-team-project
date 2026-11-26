// Data access for users. Controllers call these functions and never touch
// passwords or the database directly.
//
// bcryptjs is used instead of bcrypt because it is plain JavaScript: it installs on
// every machine and on Render without compiling anything.
import bcrypt from "bcryptjs";
import user from "./schemas/users.js";
import { getRoleByName } from "./roles.js";

const HASH_COST = 10;

// A throwaway hash. When a login uses an email that does not exist, the password is
// still compared against this, so the response takes about as long as a real login
// and does not reveal which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", HASH_COST);

// Create a user with the "customer" role. The role can never be chosen by the caller.
// Returns the user in the shape the session stores, without the password hash.
export async function createUser({ displayName, username, email, password }) {
  const customerRole = await getRoleByName("customer");

  if (!customerRole) {
    throw new Error('The "customer" role does not exist. Seed the standard roles first.');
  }

  const passwordHash = await bcrypt.hash(password, HASH_COST);

  const created = await user.create({
    displayName,
    username,
    email,
    passwordHash,
    role: customerRole._id,
  });

  return {
    id: String(created._id),
    name: created.displayName,
    username: created.username,
    email: created.email,
    role: customerRole.name,
  };
}

// Find the user with this email, including the password hash and the role (login only).
export async function findUserByEmail(email) {
  return user.findOne({ email }).select("+passwordHash").populate("role").lean();
}

// Find a user that already uses this email or username (used to reject duplicates).
export async function findExistingUser(email, username) {
  return user.findOne({ $or: [{ email }, { username }] }).lean();
}

// Compare a plain password with a stored hash. Pass `undefined` as the hash when the
// user was not found, to get the same timing as a real check.
export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash ?? DUMMY_HASH);
}