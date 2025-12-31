import { getDB } from './index';
import type { Payout, GameSession, PayoutType } from './types';
import { ObjectId } from 'mongodb';

const PAYOUTS_COLLECTION = 'payouts';
const SESSIONS_COLLECTION = 'gameSessions';

export async function recordPayout(
  code: string,
  amount: number,
  paidBy: ObjectId,
  paidByName: string,
  payoutType: PayoutType = 'cash',
  notes?: string,
  playerName?: string,
  playerPhone?: string,
  playerCountry?: string,
  requestId?: ObjectId
): Promise<Payout> {
  const db = await getDB();

  const payout: Payout = {
    code: code.toUpperCase().trim(),
    amount,
    payoutType,
    playerName: playerName || '',
    playerPhone: playerPhone || '',
    playerCountry: playerCountry || '',
    paidBy,
    paidByName,
    paidAt: new Date(),
    requestId,
    notes
  };

  const result = await db.collection<Payout>(PAYOUTS_COLLECTION).insertOne(payout);
  payout._id = result.insertedId;

  // Mark session as claimed if exists
  await db.collection<GameSession>(SESSIONS_COLLECTION).updateOne(
    { code: code.toUpperCase().trim() },
    { $set: { claimed: true, claimedAt: new Date() } }
  );

  return payout;
}

export async function getPayoutsByUser(userId: ObjectId, limit = 50): Promise<Payout[]> {
  const db = await getDB();
  return db.collection<Payout>(PAYOUTS_COLLECTION)
    .find({ paidBy: userId })
    .sort({ paidAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getAllPayouts(limit = 100): Promise<Payout[]> {
  const db = await getDB();
  return db.collection<Payout>(PAYOUTS_COLLECTION)
    .find({})
    .sort({ paidAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getPayoutsByDateRange(start: Date, end: Date): Promise<Payout[]> {
  const db = await getDB();
  return db.collection<Payout>(PAYOUTS_COLLECTION)
    .find({
      paidAt: { $gte: start, $lte: end }
    })
    .sort({ paidAt: -1 })
    .toArray();
}

export async function getPayoutStats(userId?: ObjectId) {
  const db = await getDB();

  const query = userId ? { paidBy: userId } : {};
  const payouts = await db.collection<Payout>(PAYOUTS_COLLECTION).find(query).toArray();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    totalPayouts: payouts.length,
    totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
    todayPayouts: payouts.filter(p => p.paidAt >= today).length,
    todayAmount: payouts.filter(p => p.paidAt >= today).reduce((sum, p) => sum + p.amount, 0),
    monthPayouts: payouts.filter(p => p.paidAt >= thisMonth).length,
    monthAmount: payouts.filter(p => p.paidAt >= thisMonth).reduce((sum, p) => sum + p.amount, 0),
  };
}

export async function getPayoutByCode(code: string): Promise<Payout | null> {
  const db = await getDB();
  return db.collection<Payout>(PAYOUTS_COLLECTION).findOne({
    code: code.toUpperCase().trim()
  });
}
