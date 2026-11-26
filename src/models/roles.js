import role from "./schemas/roles.js";

// Retrieve a role by its name ("customer" or "admin"), or null if it does not exist.
export async function getRoleByName(name) {
  return role.findOne({ name }).lean();
}