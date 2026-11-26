// Mongoose schema for the `roles` collection. The standard roles are "customer" and
// "admin" (see seedRoles in src/db/initialize.js). Roles are always looked up by
// name, never by a stored id, so their ids can never go out of date.
import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "roles",
  }
);

const role = mongoose.model("Role", roleSchema);

export default role;