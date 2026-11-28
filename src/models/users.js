import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['customer', 'admin'],
    unique: true,
    required: true
  }
});

export const Role = mongoose.model('Role', roleSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true }
});

export const User = mongoose.model('User', userSchema);

export async function createUser({ name, email, password }) {
  const role = await Role.findOneAndUpdate(
    { name: 'customer' },
    { $setOnInsert: { name: 'customer' } },
    { returnDocument: 'after', upsert: true }
  );
  const passwordHash = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    passwordHash,
    role: role._id
  });

  return user.save();
}

export async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() }).populate('role').exec();
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}