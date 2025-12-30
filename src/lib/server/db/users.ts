import { getDB } from './index';
import type { User, UserRole } from './types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from './config';
import { ObjectId } from 'mongodb';

const COLLECTION = 'users';

export async function createUser(
  username: string,
  password: string,
  role: UserRole,
  name: string,
  createdBy?: ObjectId
): Promise<User> {
  const db = await getDB();

  // Check if username exists
  const existing = await db.collection<User>(COLLECTION).findOne({ username: username.toLowerCase() });
  if (existing) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user: User = {
    username: username.toLowerCase(),
    password: hashedPassword,
    role,
    name,
    active: true,
    createdAt: new Date(),
    createdBy,
  };

  const result = await db.collection<User>(COLLECTION).insertOne(user);
  user._id = result.insertedId;

  return user;
}

export async function validateLogin(username: string, password: string): Promise<User | null> {
  const db = await getDB();

  const user = await db.collection<User>(COLLECTION).findOne({
    username: username.toLowerCase(),
    active: true
  });

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  // Update last login
  await db.collection<User>(COLLECTION).updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date() } }
  );

  return user;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user._id?.toString(),
      username: user.username,
      role: user.role,
      name: user.name
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpirySeconds }
  );
}

export function verifyToken(token: string): { userId: string; username: string; role: UserRole; name: string } | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      username: string;
      role: UserRole;
      name: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export async function getUserById(id: string | ObjectId): Promise<User | null> {
  const db = await getDB();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return db.collection<User>(COLLECTION).findOne({ _id: objectId });
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  return db.collection<User>(COLLECTION).find({}).toArray();
}

export async function updateUser(
  id: string | ObjectId,
  updates: Partial<Pick<User, 'name' | 'active' | 'role'>>
): Promise<boolean> {
  const db = await getDB();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const result = await db.collection<User>(COLLECTION).updateOne(
    { _id: objectId },
    { $set: updates }
  );
  return result.modifiedCount > 0;
}

export async function changePassword(id: string | ObjectId, newPassword: string): Promise<boolean> {
  const db = await getDB();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const result = await db.collection<User>(COLLECTION).updateOne(
    { _id: objectId },
    { $set: { password: hashedPassword } }
  );
  return result.modifiedCount > 0;
}

export async function getSuperAdminCount(): Promise<number> {
  const db = await getDB();
  return db.collection<User>(COLLECTION).countDocuments({ role: 'superadmin' });
}

export async function createSuperAdmin(
  username: string,
  password: string,
  name: string
): Promise<User> {
  // Check if superadmin already exists
  const count = await getSuperAdminCount();
  if (count > 0) {
    throw new Error('Super admin already exists. Use the admin panel to create more users.');
  }

  return createUser(username, password, 'superadmin', name);
}
