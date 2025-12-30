import { getDB } from './index';
import type { GameSession, GamePlay, PayoutRequest, PrizeStats, RechargeCard, CreditConversion } from './types';
import { ObjectId } from 'mongodb';

const SESSIONS_COLLECTION = 'gameSessions';
const PLAYS_COLLECTION = 'gamePlays';
const PAYOUT_REQUESTS_COLLECTION = 'payoutRequests';
const CREDIT_CONVERSIONS_COLLECTION = 'creditConversions';

// Prize configuration (~50% RTP, ~18% win rate)
export const PRIZE_CONFIG = [
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

  // Record individual play
  const play: GamePlay = {
    sessionId: session._id!,
    code: upperCode,
    gameId,
    betAmount,
    prizeAmount: prize,
    symbol,
    playedAt: new Date()
  };
  await db.collection<GamePlay>(PLAYS_COLLECTION).insertOne(play);

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

// Get prize statistics based on actual plays
export async function getPrizeStats(): Promise<PrizeStats[]> {
  const db = await getDB();
  const plays = await db.collection<GamePlay>(PLAYS_COLLECTION).find({}).toArray();

  const totalPlays = plays.length;
  if (totalPlays === 0) {
    return PRIZE_CONFIG.filter(p => p.amount > 0).map(p => ({
      prizeAmount: p.amount,
      count: 0,
      totalPaid: 0,
      expectedOdds: p.odds,
      actualOdds: 0
    }));
  }

  // Group plays by prize amount
  const prizeGroups = new Map<number, { count: number; totalPaid: number }>();

  for (const play of plays) {
    const amount = play.prizeAmount;
    const existing = prizeGroups.get(amount) || { count: 0, totalPaid: 0 };
    existing.count++;
    existing.totalPaid += amount;
    prizeGroups.set(amount, existing);
  }

  // Build stats for each prize tier
  const stats: PrizeStats[] = [];

  for (const config of PRIZE_CONFIG) {
    if (config.amount > 0) {
      const group = prizeGroups.get(config.amount) || { count: 0, totalPaid: 0 };
      stats.push({
        prizeAmount: config.amount,
        count: group.count,
        totalPaid: group.totalPaid,
        expectedOdds: config.odds,
        actualOdds: group.count > 0 ? Math.round(totalPlays / group.count) : 0
      });
    }
  }

  // Add losses (prize = 0)
  const losses = prizeGroups.get(0) || { count: 0, totalPaid: 0 };
  const wins = totalPlays - losses.count;

  return stats;
}

// Get total plays count
export async function getTotalPlays(): Promise<number> {
  const db = await getDB();
  return db.collection<GamePlay>(PLAYS_COLLECTION).countDocuments();
}

// Get plays breakdown
export async function getPlaysBreakdown(): Promise<{ totalPlays: number; totalWins: number; totalLosses: number; winRate: number; totalPrizesPaid: number }> {
  const db = await getDB();
  const plays = await db.collection<GamePlay>(PLAYS_COLLECTION).find({}).toArray();

  const totalPlays = plays.length;
  const wins = plays.filter(p => p.prizeAmount > 0);
  const totalWins = wins.length;
  const totalLosses = totalPlays - totalWins;
  const winRate = totalPlays > 0 ? (totalWins / totalPlays) * 100 : 0;
  const totalPrizesPaid = plays.reduce((sum, p) => sum + p.prizeAmount, 0);

  return { totalPlays, totalWins, totalLosses, winRate, totalPrizesPaid };
}

// ==================== PAYOUT REQUESTS ====================

// Create a payout request
export async function createPayoutRequest(
  code: string,
  gameId: string,
  amount: number,
  playerName: string,
  playerPhone: string,
  playerCountry: string
): Promise<PayoutRequest> {
  const db = await getDB();
  const upperCode = code.toUpperCase().trim();

  // Get the seller who sold this code
  const card = await db.collection<RechargeCard>('rechargeCards').findOne({ code: upperCode });

  const request: PayoutRequest = {
    code: upperCode,
    gameId,
    amount,
    playerName,
    playerPhone,
    playerCountry,
    status: 'pending',
    createdAt: new Date(),
    sellerId: card?.soldBy,
    sellerName: card?.soldByName
  };

  const result = await db.collection<PayoutRequest>(PAYOUT_REQUESTS_COLLECTION).insertOne(request);
  request._id = result.insertedId;

  // Mark the session as claimed
  await claimSession(code, gameId);

  return request;
}

// Get payout requests (filtered by seller for sellers)
export async function getPayoutRequests(
  userId?: ObjectId,
  role?: string,
  limit = 100
): Promise<PayoutRequest[]> {
  const db = await getDB();

  const query: Record<string, unknown> = {};

  // Sellers can only see their own requests
  if (role === 'seller' && userId) {
    query.sellerId = userId;
  }

  return db.collection<PayoutRequest>(PAYOUT_REQUESTS_COLLECTION)
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

// Get pending payout requests count
export async function getPendingPayoutCount(userId?: ObjectId, role?: string): Promise<number> {
  const db = await getDB();

  const query: Record<string, unknown> = { status: 'pending' };

  if (role === 'seller' && userId) {
    query.sellerId = userId;
  }

  return db.collection<PayoutRequest>(PAYOUT_REQUESTS_COLLECTION).countDocuments(query);
}

// Process a payout request
export async function processPayoutRequest(
  requestId: ObjectId,
  processedBy: ObjectId,
  processedByName: string,
  status: string,
  notes?: string
): Promise<PayoutRequest | null> {
  const db = await getDB();

  // Build the query based on allowed transitions
  // pending -> approved/rejected
  // approved -> paid
  let allowedCurrentStatus: string[];
  if (status === 'approved' || status === 'rejected') {
    allowedCurrentStatus = ['pending'];
  } else if (status === 'paid') {
    allowedCurrentStatus = ['pending', 'approved'];
  } else {
    return null;
  }

  const request = await db.collection<PayoutRequest>(PAYOUT_REQUESTS_COLLECTION).findOneAndUpdate(
    { _id: requestId, status: { $in: allowedCurrentStatus } },
    {
      $set: {
        status,
        processedAt: new Date(),
        processedBy,
        processedByName,
        ...(notes && { notes })
      }
    },
    { returnDocument: 'after' }
  );

  return request;
}

// Get payout request by ID
export async function getPayoutRequestById(requestId: ObjectId): Promise<PayoutRequest | null> {
  const db = await getDB();
  return db.collection<PayoutRequest>(PAYOUT_REQUESTS_COLLECTION).findOne({ _id: requestId });
}

// Check if a payout request exists for a code
export async function getPayoutRequestByCode(code: string): Promise<PayoutRequest | null> {
  const db = await getDB();
  return db.collection<PayoutRequest>(PAYOUT_REQUESTS_COLLECTION).findOne({
    code: code.toUpperCase().trim()
  });
}

// Get payout request stats
export async function getPayoutRequestStats(userId?: ObjectId, role?: string) {
  const db = await getDB();

  const query: Record<string, unknown> = {};
  if (role === 'seller' && userId) {
    query.sellerId = userId;
  }

  const requests = await db.collection<PayoutRequest>(PAYOUT_REQUESTS_COLLECTION).find(query).toArray();

  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    paid: requests.filter(r => r.status === 'paid').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalAmount: requests.reduce((sum, r) => sum + r.amount, 0),
    pendingAmount: requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
    paidAmount: requests.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0),
  };
}

// ==================== CREDIT CONVERSIONS ====================

// Record when a player converts winnings to credits
export async function recordCreditConversion(
  code: string,
  gameId: string,
  amount: number,
  playerName: string,
  playerPhone: string,
  playerCountry: string
): Promise<CreditConversion> {
  const db = await getDB();
  const upperCode = code.toUpperCase().trim();

  // Get the seller who sold this code
  const card = await db.collection<RechargeCard>('rechargeCards').findOne({ code: upperCode });

  const conversion: CreditConversion = {
    code: upperCode,
    gameId,
    amount,
    playerName,
    playerPhone,
    playerCountry,
    convertedAt: new Date(),
    sellerId: card?.soldBy,
    sellerName: card?.soldByName
  };

  const result = await db.collection<CreditConversion>(CREDIT_CONVERSIONS_COLLECTION).insertOne(conversion);
  conversion._id = result.insertedId;

  return conversion;
}

// Get credit conversion stats
export async function getCreditConversionStats() {
  const db = await getDB();
  const conversions = await db.collection<CreditConversion>(CREDIT_CONVERSIONS_COLLECTION).find({}).toArray();

  return {
    total: conversions.length,
    totalAmount: conversions.reduce((sum, c) => sum + c.amount, 0)
  };
}
