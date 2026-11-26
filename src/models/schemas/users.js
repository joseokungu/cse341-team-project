// Mongoose schema for the `users` collection.
import mongoose from "mongoose";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: EMAIL_PATTERN,
    },
    // Only the bcrypt hash is stored. select: false means queries leave it out
    // unless they ask for it explicitly (the login check does), so it cannot be
    // returned by accident.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    // A reference to a document in the roles collection.
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

const user = mongoose.model("User", userSchema);

export default user;