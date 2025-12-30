import { getDB } from './index';
import type { GameSession } from './types';

const SESSIONS_COLLECTION = 'gameSessions';

// Prize configuration (~50% RTP, ~18% win rate)
const PRIZE_CONFIG = [
  { amount: 500, odds: 8945 },  // ~0.011% chance
  { amount: 100, odds: 3334 },  // ~0.030% chance
  { amount: 50, odds: 1243 },   // ~0.080% chance
  { amount: 20, odds: 463 },    // ~0.216% chance
  { amount: 10, odds: 173 },    // ~0.578% chance
  { amount: 5, odds: 64 },      // ~1.563% chance
  { amount: 2, odds: 24 },      // ~4.167% chance
  { amount: 1, odds: 9 },       // ~11.111% chance
  { amount: 0, odds: 0 },       // Loss (~82.244% chance)
];

const MAX_PRIZE = 500;

// Calculate prize server-side (secure random)
export function calculatePrize(betMultiplier: number = 1): number {
  const rand = Math.random();
  let cumulative = 0;

  for (const prize of PRIZE_CONFIG) {
    if (prize.amount > 0) {
      cumulative += 1 / prize.odds;
      if (rand <= cumulative) {
        return Math.min(prize.amount * betMultiplier, MAX_PRIZE);
      }
    }
  }

  return 0;
}

// Get the symbol for a prize amount
export function getPrizeSymbol(amount: number): string {
  const symbolMap: Record<number, string> = {
    500: 'diamond',
    100: 'seven',
    50: 'bar',
    20: 'bell',
    10: 'star',
    5: 'cherry',
    2: 'plum',
    1: 'lemon',
  };

  // Handle multiplied amounts
  const baseAmount = Object.keys(symbolMap)
    .map(Number)
    .sort((a, b) => b - a)
    .find(base => amount >= base && amount % base === 0);

  return baseAmount ? symbolMap[baseAmount] : 'lemon';
}

// Get or create game session for a code
export async function getOrCreateSession(
  code: string,
  gameId: string,
  initialPlays: number
): Promise<GameSession> {
  const db = await getDB();
  const upperCode = code.toUpperCase().trim();

  // Check for existing session
  let session = await db.collection<GameSession>(SESSIONS_COLLECTION).findOne({
    code: upperCode,
    gameId
  });

  if (session) {
    return session;
  }

  // Create new session
  const newSession: GameSession = {
    code: upperCode,
    gameId,
    startedAt: new Date(),
    initialPlays,
    playsUsed: 0,
    totalWinnings: 0,
    claimed: false,
  };

  const result = await db.collection<GameSession>(SESSIONS_COLLECTION).insertOne(newSession);
  newSession._id = result.insertedId;

  return newSession;
}

// Get session by code
export async function getSession(code: string, gameId: string): Promise<GameSession | null> {
  const db = await getDB();
  return db.collection<GameSession>(SESSIONS_COLLECTION).findOne({
    code: code.toUpperCase().trim(),
    gameId
  });
}

// Record a play and return the result
export async function recordPlay(
  code: string,
  gameId: string,
  betAmount: number = 1
): Promise<{ success: boolean; prize: number; symbol: string; playsLeft: number; totalWinnings: number; error?: string }> {
  const db = await getDB();
  const upperCode = code.toUpperCase().trim();

  // Get session
  const session = await db.collection<GameSession>(SESSIONS_COLLECTION).findOne({
    code: upperCode,
    gameId
  });

  if (!session) {
    return { success: false, prize: 0, symbol: '', playsLeft: 0, totalWinnings: 0, error: 'Session not found' };
  }

  const playsLeft = session.initialPlays - session.playsUsed;

  if (playsLeft < betAmount) {
    return { success: false, prize: 0, symbol: '', playsLeft, totalWinnings: session.totalWinnings, error: 'Not enough plays' };
  }

  // Calculate prize server-side
  const prize = calculatePrize(betAmount);
  const symbol = prize > 0 ? getPrizeSymbol(prize) : '';

  // Update session
  const updatedSession = await db.collection<GameSession>(SESSIONS_COLLECTION).findOneAndUpdate(
    { _id: session._id },
    {
      $inc: {
        playsUsed: betAmount,
        totalWinnings: prize
      }
    },
    { returnDocument: 'after' }
  );

  if (!updatedSession) {
    return { success: false, prize: 0, symbol: '', playsLeft, totalWinnings: session.totalWinnings, error: 'Failed to update session' };
  }

  return {
    success: true,
    prize,
    symbol,
    playsLeft: updatedSession.initialPlays - updatedSession.playsUsed,
    totalWinnings: updatedSession.totalWinnings
  };
}

// Get session status
export async function getSessionStatus(
  code: string,
  gameId: string
): Promise<{ exists: boolean; playsLeft: number; totalWinnings: number; claimed: boolean } | null> {
  const session = await getSession(code, gameId);

  if (!session) {
    return null;
  }

  return {
    exists: true,
    playsLeft: session.initialPlays - session.playsUsed,
    totalWinnings: session.totalWinnings,
    claimed: session.claimed
  };
}

// Mark session as claimed
export async function claimSession(code: string, gameId: string): Promise<boolean> {
  const db = await getDB();

  const result = await db.collection<GameSession>(SESSIONS_COLLECTION).updateOne(
    { code: code.toUpperCase().trim(), gameId, claimed: false },
    {
      $set: {
        claimed: true,
        claimedAt: new Date(),
        endedAt: new Date()
      }
    }
  );

  return result.modifiedCount > 0;
}

// Get all sessions for stats
export async function getAllSessions(limit = 100): Promise<GameSession[]> {
  const db = await getDB();
  return db.collection<GameSession>(SESSIONS_COLLECTION)
    .find({})
    .sort({ startedAt: -1 })
    .limit(limit)
    .toArray();
}

// Get game session stats
export async function getGameSessionStats() {
  const db = await getDB();
  const sessions = await db.collection<GameSession>(SESSIONS_COLLECTION).find({}).toArray();

  return {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => !s.endedAt).length,
    totalPlaysUsed: sessions.reduce((sum, s) => sum + s.playsUsed, 0),
    totalWinnings: sessions.reduce((sum, s) => sum + s.totalWinnings, 0),
    claimedSessions: sessions.filter(s => s.claimed).length,
  };
}
