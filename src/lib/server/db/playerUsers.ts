import { getDB } from './index';
import type { PlayerUser, SupportedLanguage, PlayerDeposit, PlayerWithdrawal, DepositType, GamePlay } from './types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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

// Check if user is email-only (requires 2FA)
export function isEmailOnlyUser(user: PlayerUser): boolean {
  return !!user.email && !user.metamaskAddress;
}

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Generate and store 2FA code for a user
export async function generate2FACode(userId: string | ObjectId): Promise<string | null> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  const code = generateVerificationCode();
  const hashedCode = await bcrypt.hash(code, 10);
  const expiry = new Date(Date.now() + config.twoFactorCodeExpiry);

  const result = await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    {
      $set: {
        twoFactorCode: hashedCode,
        twoFactorExpiry: expiry
      }
    }
  );

  if (result.modifiedCount === 0) {
    return null;
  }

  return code;
}

// Verify 2FA code and complete login
export async function verify2FACode(
  userId: string | ObjectId,
  code: string
): Promise<{ valid: boolean; user?: PlayerUser; error?: string }> {
  const db = await getDB();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  const user = await db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });

  if (!user) {
    return { valid: false, error: 'User not found' };
  }

  if (!user.twoFactorCode || !user.twoFactorExpiry) {
    return { valid: false, error: 'No verification code pending' };
  }

  // Check if code expired
  if (new Date() > user.twoFactorExpiry) {
    // Clear expired code
    await db.collection<PlayerUser>(COLLECTION).updateOne(
      { _id: objectId },
      { $unset: { twoFactorCode: '', twoFactorExpiry: '' } }
    );
    return { valid: false, error: 'Verification code expired' };
  }

  // Verify code
  const isValid = await bcrypt.compare(code, user.twoFactorCode);

  if (!isValid) {
    return { valid: false, error: 'Invalid verification code' };
  }

  // Clear the code and update last login
  await db.collection<PlayerUser>(COLLECTION).updateOne(
    { _id: objectId },
    {
      $set: { lastLogin: new Date() },
      $unset: { twoFactorCode: '', twoFactorExpiry: '' }
    }
  );

  // Return updated user
  const updatedUser = await db.collection<PlayerUser>(COLLECTION).findOne({ _id: objectId });
  return { valid: true, user: updatedUser! };
}

// ==================== PLAYER TRANSACTION HISTORY ====================

const DEPOSITS_COLLECTION = 'playerDeposits';
const WITHDRAWALS_COLLECTION = 'playerWithdrawals';
const PLAYS_COLLECTION = 'gamePlays';

// Record a player deposit
export async function recordPlayerDeposit(
  playerId: string | ObjectId,
  type: DepositType,
  amount: number,
  options?: {
    rechargeCode?: string;
    network?: string;
    txHash?: string;
  }
): Promise<PlayerDeposit> {
  const db = await getDB();
  const playerObjectId = typeof playerId === 'string' ? new ObjectId(playerId) : playerId;

  const deposit: PlayerDeposit = {
    playerId: playerObjectId,
    type,
    amount,
    rechargeCode: options?.rechargeCode,
    network: options?.network,
    txHash: options?.txHash,
    createdAt: new Date()
  };

  const result = await db.collection<PlayerDeposit>(DEPOSITS_COLLECTION).insertOne(deposit);
  deposit._id = result.insertedId;

  return deposit;
}

// Get player's deposit history
export async function getPlayerDeposits(
  playerId: string | ObjectId,
  limit = 50,
  offset = 0
): Promise<{ deposits: PlayerDeposit[]; total: number }> {
  const db = await getDB();
  const playerObjectId = typeof playerId === 'string' ? new ObjectId(playerId) : playerId;

  const [deposits, total] = await Promise.all([
    db.collection<PlayerDeposit>(DEPOSITS_COLLECTION)
      .find({ playerId: playerObjectId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<PlayerDeposit>(DEPOSITS_COLLECTION)
      .countDocuments({ playerId: playerObjectId })
  ]);

  return { deposits, total };
}

// Record a player withdrawal request
export async function recordPlayerWithdrawal(
  playerId: string | ObjectId,
  type: 'crypto' | 'cash',
  amount: number,
  options?: {
    network?: string;
    walletAddress?: string;
    playerName?: string;
    playerPhone?: string;
    playerCountry?: string;
  }
): Promise<PlayerWithdrawal> {
  const db = await getDB();
  const playerObjectId = typeof playerId === 'string' ? new ObjectId(playerId) : playerId;

  const withdrawal: PlayerWithdrawal = {
    playerId: playerObjectId,
    type,
    amount,
    status: 'pending',
    network: options?.network,
    walletAddress: options?.walletAddress,
    playerName: options?.playerName,
    playerPhone: options?.playerPhone,
    playerCountry: options?.playerCountry,
    createdAt: new Date()
  };

  const result = await db.collection<PlayerWithdrawal>(WITHDRAWALS_COLLECTION).insertOne(withdrawal);
  withdrawal._id = result.insertedId;

  return withdrawal;
}

// Get player's withdrawal history
export async function getPlayerWithdrawals(
  playerId: string | ObjectId,
  limit = 50,
  offset = 0
): Promise<{ withdrawals: PlayerWithdrawal[]; total: number }> {
  const db = await getDB();
  const playerObjectId = typeof playerId === 'string' ? new ObjectId(playerId) : playerId;

  const [withdrawals, total] = await Promise.all([
    db.collection<PlayerWithdrawal>(WITHDRAWALS_COLLECTION)
      .find({ playerId: playerObjectId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<PlayerWithdrawal>(WITHDRAWALS_COLLECTION)
      .countDocuments({ playerId: playerObjectId })
  ]);

  return { withdrawals, total };
}

// Get player's bet/play history
export async function getPlayerBetHistory(
  playerId: string | ObjectId,
  limit = 50,
  offset = 0
): Promise<{ bets: GamePlay[]; total: number }> {
  const db = await getDB();
  const playerObjectId = typeof playerId === 'string' ? new ObjectId(playerId) : playerId;

  // Get all plays associated with this player via their deposited sessions
  // First, get all deposit codes for this player
  const deposits = await db.collection<PlayerDeposit>(DEPOSITS_COLLECTION)
    .find({ playerId: playerObjectId, type: 'recharge' })
    .project({ rechargeCode: 1 })
    .toArray();

  const codes = deposits.map(d => d.rechargeCode).filter(Boolean) as string[];

  if (codes.length === 0) {
    // If no codes, try to find plays by playerId directly (for USDT balance plays)
    const [bets, total] = await Promise.all([
      db.collection<GamePlay>(PLAYS_COLLECTION)
        .find({ playerId: playerObjectId })
        .sort({ playedAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection<GamePlay>(PLAYS_COLLECTION)
        .countDocuments({ playerId: playerObjectId })
    ]);
    return { bets, total };
  }

  // Get plays for all codes
  const [bets, total] = await Promise.all([
    db.collection<GamePlay>(PLAYS_COLLECTION)
      .find({ $or: [{ code: { $in: codes } }, { playerId: playerObjectId }] })
      .sort({ playedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<GamePlay>(PLAYS_COLLECTION)
      .countDocuments({ $or: [{ code: { $in: codes } }, { playerId: playerObjectId }] })
  ]);

  return { bets, total };
}

// Get combined transaction history (deposits, withdrawals, and bets)
export async function getPlayerTransactionHistory(
  playerId: string | ObjectId,
  filter: 'all' | 'deposits' | 'withdrawals' | 'bets' = 'all',
  limit = 50,
  offset = 0
): Promise<{
  transactions: Array<{
    id: string;
    type: 'deposit' | 'withdrawal' | 'bet';
    amount: number;
    status?: string;
    gameId?: string;
    prizeAmount?: number;
    createdAt: Date;
    details?: Record<string, unknown>;
  }>;
  total: number;
}> {
  const db = await getDB();
  const playerObjectId = typeof playerId === 'string' ? new ObjectId(playerId) : playerId;

  const transactions: Array<{
    id: string;
    type: 'deposit' | 'withdrawal' | 'bet';
    amount: number;
    status?: string;
    gameId?: string;
    prizeAmount?: number;
    createdAt: Date;
    details?: Record<string, unknown>;
  }> = [];

  // Get deposits if filter allows
  if (filter === 'all' || filter === 'deposits') {
    const deposits = await db.collection<PlayerDeposit>(DEPOSITS_COLLECTION)
      .find({ playerId: playerObjectId })
      .toArray();

    for (const d of deposits) {
      transactions.push({
        id: d._id!.toString(),
        type: 'deposit',
        amount: d.amount,
        createdAt: d.createdAt,
        details: {
          depositType: d.type,
          rechargeCode: d.rechargeCode,
          network: d.network,
          txHash: d.txHash
        }
      });
    }
  }

  // Get withdrawals if filter allows
  if (filter === 'all' || filter === 'withdrawals') {
    const withdrawals = await db.collection<PlayerWithdrawal>(WITHDRAWALS_COLLECTION)
      .find({ playerId: playerObjectId })
      .toArray();

    for (const w of withdrawals) {
      transactions.push({
        id: w._id!.toString(),
        type: 'withdrawal',
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt,
        details: {
          withdrawalType: w.type,
          network: w.network,
          walletAddress: w.walletAddress
        }
      });
    }
  }

  // Get bets if filter allows
  if (filter === 'all' || filter === 'bets') {
    const betHistory = await getPlayerBetHistory(playerObjectId, 1000, 0);

    for (const b of betHistory.bets) {
      transactions.push({
        id: b._id!.toString(),
        type: 'bet',
        amount: b.betAmount,
        gameId: b.gameId,
        prizeAmount: b.prizeAmount,
        createdAt: b.playedAt,
        details: {
          symbol: b.symbol
        }
      });
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Apply pagination
  const total = transactions.length;
  const paginated = transactions.slice(offset, offset + limit);

  return { transactions: paginated, total };
}
