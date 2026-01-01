import { getDB } from './index';
import type { PlayerUser, SupportedLanguage } from './types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from './config';
import { ObjectId } from 'mongodb';

const COLLECTION = 'playerUsers';

export interface CreatePlayerUserInput {
  email: string;
  password: string;
  fullName: string;
  country: string;
  preferredLanguage: SupportedLanguage;
}

export async function createPlayerUser(input: CreatePlayerUserInput): Promise<PlayerUser> {
  const db = await getDB();

  // Check if email exists
  const existing = await db.collection<PlayerUser>(COLLECTION).findOne({
    email: input.email.toLowerCase()
  });
  if (existing) {
    throw new Error('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user: PlayerUser = {
    email: input.email.toLowerCase(),
    password: hashedPassword,
    fullName: input.fullName,
    country: input.country,
    preferredLanguage: input.preferredLanguage,
    active: true,
    createdAt: new Date(),
  };

  const result = await db.collection<PlayerUser>(COLLECTION).insertOne(user);
  user._id = result.insertedId;

  return user;
}

export async function validatePlayerLogin(email: string, password: string): Promise<PlayerUser | null> {
  const db = await getDB();

  const user = await db.collection<PlayerUser>(COLLECTION).findOne({
    email: email.toLowerCase(),
    active: true
  });

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  // Update last login
  await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date() } }
  );

  return user;
}

export async function loginWithMetamask(metamaskAddress: string): Promise<PlayerUser | null> {
  const db = await getDB();

  const user = await db.collection<PlayerUser>(COLLECTION).findOne({
    metamaskAddress: metamaskAddress.toLowerCase(),
    active: true
  });

  if (!user) return null;

  // Update last login
  await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date() } }
  );

  return user;
}

export async function createMetamaskUser(metamaskAddress: string): Promise<PlayerUser> {
  const db = await getDB();
  const normalizedAddress = metamaskAddress.toLowerCase();

  // Check if metamask address already exists
  const existing = await db.collection<PlayerUser>(COLLECTION).findOne({
    metamaskAddress: normalizedAddress
  });
  if (existing) {
    throw new Error('Wallet already registered');
  }

  // Create user with MetaMask address only (no email/password required)
  // Use shortened wallet address as display name
  const shortAddress = `${metamaskAddress.slice(0, 6)}...${metamaskAddress.slice(-4)}`;

  const user: PlayerUser = {
    fullName: shortAddress,
    country: 'Unknown',
    preferredLanguage: 'en',
    metamaskAddress: normalizedAddress,
    active: true,
    createdAt: new Date(),
    lastLogin: new Date()
  };

  const result = await db.collection<PlayerUser>(COLLECTION).insertOne(user);
  user._id = result.insertedId;

  return user;
}

export async function linkMetamaskToAccount(
  userId: string | ObjectId,
  metamaskAddress: string
): Promise<boolean> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  // Check if metamask address is already linked to another account
  const existing = await db.collection<PlayerUser>(COLLECTION).findOne({
    metamaskAddress: metamaskAddress.toLowerCase(),
    _id: { $ne: objectId }
  });

  if (existing) {
    throw new Error('This wallet is already linked to another account');
  }

  const result = await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    { $set: { metamaskAddress: metamaskAddress.toLowerCase() } }
  );

  return result.modifiedCount > 0;
}

export async function unlinkMetamask(userId: string | ObjectId): Promise<boolean> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  const result = await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    { $unset: { metamaskAddress: '' } }
  );

  return result.modifiedCount > 0;
}

export function generatePlayerToken(user: PlayerUser): string {
  return jwt.sign(
    {
      odSI: user._id?.toString(),
      email: user.email,
      fullName: user.fullName,
      country: user.country,
      preferredLanguage: user.preferredLanguage,
      metamaskAddress: user.metamaskAddress
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpirySeconds }
  );
}

export interface PlayerTokenPayload {
  odSI: string;
  email?: string; // Optional for MetaMask-only accounts
  fullName: string;
  country: string;
  preferredLanguage: SupportedLanguage;
  metamaskAddress?: string;
}

export function verifyPlayerToken(token: string): PlayerTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as PlayerTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function getPlayerUserById(id: string | ObjectId): Promise<PlayerUser | null> {
  const db = await getDB();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });
}

export async function getPlayerUserByEmail(email: string): Promise<PlayerUser | null> {
  const db = await getDB();
  return db.collection<PlayerUser>(COLLECTION).findOne({ email: email.toLowerCase() });
}

export async function getPlayerUserByMetamask(metamaskAddress: string): Promise<PlayerUser | null> {
  const db = await getDB();
  return db.collection<PlayerUser>(COLLECTION).findOne({
    metamaskAddress: metamaskAddress.toLowerCase()
  });
}

export async function updatePlayerUser(
  id: string | ObjectId,
  updates: Partial<Pick<PlayerUser, 'fullName' | 'country' | 'preferredLanguage' | 'active'>>
): Promise<boolean> {
  const db = await getDB();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const result = await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    { $set: updates }
  );
  return result.modifiedCount > 0;
}

export async function changePlayerPassword(id: string | ObjectId, newPassword: string): Promise<boolean> {
  const db = await getDB();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const result = await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    { $set: { password: hashedPassword } }
  );
  return result.modifiedCount > 0;
}

// Add to player's USDT balance (for deposits from recharge cards)
export async function addToPlayerBalance(
  userId: string | ObjectId,
  amount: number,
  addToWagerRequired: boolean = true
): Promise<{ success: boolean; newBalance: number; wagerRequired: number; wagerCompleted: number }> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  // Get current user to check balance
  const user = await db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });
  if (!user) {
    return { success: false, newBalance: 0, wagerRequired: 0, wagerCompleted: 0 };
  }

  const currentBalance = user.usdtBalance ?? 0;
  const currentWagerRequired = user.wagerRequired ?? 0;
  const currentWagerCompleted = user.wagerCompleted ?? 0;
  const newBalance = currentBalance + amount;
  // Wager requirement: deposit amount must be wagered 1x before withdrawal
  const newWagerRequired = addToWagerRequired ? currentWagerRequired + amount : currentWagerRequired;

  await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    {
      $set: {
        usdtBalance: newBalance,
        wagerRequired: newWagerRequired
      }
    }
  );

  return {
    success: true,
    newBalance,
    wagerRequired: newWagerRequired,
    wagerCompleted: currentWagerCompleted
  };
}

// Deduct from player's USDT balance (for bets)
export async function deductFromPlayerBalance(
  userId: string | ObjectId,
  amount: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  // Get current user to check balance
  const user = await db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });
  if (!user) {
    return { success: false, newBalance: 0, error: 'User not found' };
  }

  const currentBalance = user.usdtBalance ?? 0;
  if (currentBalance < amount) {
    return { success: false, newBalance: currentBalance, error: 'Insufficient balance' };
  }

  const newBalance = currentBalance - amount;

  await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    { $set: { usdtBalance: newBalance } }
  );

  return { success: true, newBalance };
}

// Process a game play: deduct bet, add winnings, update wager
export async function processPlayerGamePlay(
  userId: string | ObjectId,
  bet: number,
  winnings: number
): Promise<{
  success: boolean;
  newBalance: number;
  wagerRequired: number;
  wagerCompleted: number;
  wagerMet: boolean;
  error?: string;
}> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  // Get current user
  const user = await db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });
  if (!user) {
    return {
      success: false,
      newBalance: 0,
      wagerRequired: 0,
      wagerCompleted: 0,
      wagerMet: false,
      error: 'User not found'
    };
  }

  const currentBalance = user.usdtBalance ?? 0;
  if (currentBalance < bet) {
    return {
      success: false,
      newBalance: currentBalance,
      wagerRequired: user.wagerRequired ?? 0,
      wagerCompleted: user.wagerCompleted ?? 0,
      wagerMet: (user.wagerCompleted ?? 0) >= (user.wagerRequired ?? 0),
      error: 'Insufficient balance'
    };
  }

  // Calculate new values
  const newBalance = currentBalance - bet + winnings;
  const wagerRequired = user.wagerRequired ?? 0;
  const newWagerCompleted = (user.wagerCompleted ?? 0) + bet;
  const wagerMet = newWagerCompleted >= wagerRequired;

  await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    {
      $set: {
        usdtBalance: newBalance,
        wagerCompleted: newWagerCompleted
      }
    }
  );

  return {
    success: true,
    newBalance,
    wagerRequired,
    wagerCompleted: newWagerCompleted,
    wagerMet
  };
}

// Get player balance info
export async function getPlayerBalance(userId: string | ObjectId): Promise<{
  balance: number;
  wagerRequired: number;
  wagerCompleted: number;
  wagerMet: boolean;
} | null> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  const user = await db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });
  if (!user) return null;

  const wagerRequired = user.wagerRequired ?? 0;
  const wagerCompleted = user.wagerCompleted ?? 0;

  return {
    balance: user.usdtBalance ?? 0,
    wagerRequired,
    wagerCompleted,
    wagerMet: wagerCompleted >= wagerRequired
  };
}

export async function linkEmailToAccount(
  userId: string | ObjectId,
  email: string,
  password: string,
  fullName?: string
): Promise<PlayerUser> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const normalizedEmail = email.toLowerCase();

  // Check if email is already used by another account
  const existingEmail = await db.collection<PlayerUser>(COLLECTION).findOne({
    email: normalizedEmail,
    _id: { $ne: objectId }
  });

  if (existingEmail) {
    throw new Error('Email already in use');
  }

  // Get the current user
  const user = await db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user already has email linked
  if (user.email) {
    throw new Error('Email already linked to this account');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updates: Partial<PlayerUser> = {
    email: normalizedEmail,
    password: hashedPassword
  };

  // Update fullName if provided
  if (fullName && fullName.trim()) {
    updates.fullName = fullName.trim();
  }

  await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    { $set: updates }
  );

  // Return updated user
  const updatedUser = await db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });
  return updatedUser!;
}
