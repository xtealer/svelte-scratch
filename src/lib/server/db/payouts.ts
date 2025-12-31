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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const matchStage = userId ? { $match: { paidBy: userId } } : { $match: {} };

  const pipeline = [
    matchStage,
    {
      $facet: {
        total: [
          {
            $group: {
              _id: null,
              totalPayouts: { $sum: 1 },
              totalAmount: { $sum: '$amount' }
            }
          }
        ],
        today: [
          { $match: { paidAt: { $gte: today } } },
          {
            $group: {
              _id: null,
              todayPayouts: { $sum: 1 },
              todayAmount: { $sum: '$amount' }
            }
          }
        ],
        month: [
          { $match: { paidAt: { $gte: thisMonth } } },
          {
            $group: {
              _id: null,
              monthPayouts: { $sum: 1 },
              monthAmount: { $sum: '$amount' }
            }
          }
        ]
      }
    }
  ];

  const result = await db.collection<Payout>(PAYOUTS_COLLECTION).aggregate(pipeline).toArray();
  const data = result[0];

  const total = data.total[0] || { totalPayouts: 0, totalAmount: 0 };
  const todayData = data.today[0] || { todayPayouts: 0, todayAmount: 0 };
  const monthData = data.month[0] || { monthPayouts: 0, monthAmount: 0 };

  return {
    totalPayouts: total.totalPayouts,
    totalAmount: total.totalAmount,
    todayPayouts: todayData.todayPayouts,
    todayAmount: todayData.todayAmount,
    monthPayouts: monthData.monthPayouts,
    monthAmount: monthData.monthAmount,
  };
}

export async function getPayoutByCode(code: string): Promise<Payout | null> {
  const db = await getDB();
  return db.collection<Payout>(PAYOUTS_COLLECTION).findOne({
    code: code.toUpperCase().trim()
  });
}
