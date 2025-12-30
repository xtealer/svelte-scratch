import { getDB } from './index';
import type { Sale } from './types';
import { ObjectId } from 'mongodb';

const COLLECTION = 'sales';

export async function getSalesByUser(userId: ObjectId, limit = 50): Promise<Sale[]> {
  const db = await getDB();
  return db.collection<Sale>(COLLECTION)
    .find({ sellerId: userId })
    .sort({ soldAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getAllSales(limit = 100): Promise<Sale[]> {
  const db = await getDB();
  return db.collection<Sale>(COLLECTION)
    .find({})
    .sort({ soldAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getSalesByDateRange(start: Date, end: Date, userId?: ObjectId): Promise<Sale[]> {
  const db = await getDB();

  const query: Record<string, unknown> = {
    soldAt: { $gte: start, $lte: end }
  };

  if (userId) {
    query.sellerId = userId;
  }

  return db.collection<Sale>(COLLECTION)
    .find(query)
    .sort({ soldAt: -1 })
    .toArray();
}

export async function getSalesStats(userId?: ObjectId) {
  const db = await getDB();

  const query = userId ? { sellerId: userId } : {};
  const sales = await db.collection<Sale>(COLLECTION).find(query).toArray();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const todaySales = sales.filter(s => s.soldAt >= today);
  const monthSales = sales.filter(s => s.soldAt >= thisMonth);

  return {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.price, 0),
    totalPlays: sales.reduce((sum, s) => sum + s.plays, 0),
    todaySales: todaySales.length,
    todayRevenue: todaySales.reduce((sum, s) => sum + s.price, 0),
    monthSales: monthSales.length,
    monthRevenue: monthSales.reduce((sum, s) => sum + s.price, 0),
  };
}

export async function getTopSellers(limit = 10) {
  const db = await getDB();

  const pipeline = [
    {
      $group: {
        _id: '$sellerId',
        sellerName: { $first: '$sellerName' },
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$price' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ];

  return db.collection<Sale>(COLLECTION).aggregate(pipeline).toArray();
}
