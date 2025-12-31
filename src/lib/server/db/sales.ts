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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const matchStage = userId ? { $match: { sellerId: userId } } : { $match: {} };

  const pipeline = [
    matchStage,
    {
      $facet: {
        total: [
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: '$price' },
              totalPlays: { $sum: '$plays' }
            }
          }
        ],
        today: [
          { $match: { soldAt: { $gte: today } } },
          {
            $group: {
              _id: null,
              todaySales: { $sum: 1 },
              todayRevenue: { $sum: '$price' }
            }
          }
        ],
        month: [
          { $match: { soldAt: { $gte: thisMonth } } },
          {
            $group: {
              _id: null,
              monthSales: { $sum: 1 },
              monthRevenue: { $sum: '$price' }
            }
          }
        ]
      }
    }
  ];

  const result = await db.collection<Sale>(COLLECTION).aggregate(pipeline).toArray();
  const data = result[0];

  const total = data.total[0] || { totalSales: 0, totalRevenue: 0, totalPlays: 0 };
  const todayData = data.today[0] || { todaySales: 0, todayRevenue: 0 };
  const monthData = data.month[0] || { monthSales: 0, monthRevenue: 0 };

  return {
    totalSales: total.totalSales,
    totalRevenue: total.totalRevenue,
    totalPlays: total.totalPlays,
    todaySales: todayData.todaySales,
    todayRevenue: todayData.todayRevenue,
    monthSales: monthData.monthSales,
    monthRevenue: monthData.monthRevenue,
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
