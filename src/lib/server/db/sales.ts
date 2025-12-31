import { getDB } from './index';
import type { RechargeCard } from './types';
import { ObjectId } from 'mongodb';

const CARDS_COLLECTION = 'rechargeCards';

// Sale data is now derived from cards (card generation = sale)
export interface CardSale {
  _id?: ObjectId;
  code: string;
  price: number;
  plays: number;
  sellerId: ObjectId;
  sellerName?: string;
  soldAt: Date;
}

export async function getSalesByUser(userId: ObjectId, limit = 50): Promise<CardSale[]> {
  const db = await getDB();

  const pipeline = [
    { $match: { createdBy: userId } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'creator'
      }
    },
    {
      $project: {
        _id: 1,
        code: 1,
        price: 1,
        plays: 1,
        sellerId: '$createdBy',
        sellerName: { $arrayElemAt: ['$creator.username', 0] },
        soldAt: '$createdAt'
      }
    }
  ];

  return db.collection<RechargeCard>(CARDS_COLLECTION).aggregate<CardSale>(pipeline).toArray();
}

export async function getAllSales(limit = 100): Promise<CardSale[]> {
  const db = await getDB();

  const pipeline = [
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'creator'
      }
    },
    {
      $project: {
        _id: 1,
        code: 1,
        price: 1,
        plays: 1,
        sellerId: '$createdBy',
        sellerName: { $arrayElemAt: ['$creator.username', 0] },
        soldAt: '$createdAt'
      }
    }
  ];

  return db.collection<RechargeCard>(CARDS_COLLECTION).aggregate<CardSale>(pipeline).toArray();
}

export async function getSalesStats(userId?: ObjectId) {
  const db = await getDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Match by createdBy (seller) if userId provided
  const matchStage = userId ? { $match: { createdBy: userId } } : { $match: {} };

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
          { $match: { createdAt: { $gte: today } } },
          {
            $group: {
              _id: null,
              todaySales: { $sum: 1 },
              todayRevenue: { $sum: '$price' }
            }
          }
        ],
        month: [
          { $match: { createdAt: { $gte: thisMonth } } },
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

  const result = await db.collection<RechargeCard>(CARDS_COLLECTION).aggregate(pipeline).toArray();
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
        _id: '$createdBy',
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$price' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'seller'
      }
    },
    {
      $project: {
        _id: 1,
        sellerName: { $arrayElemAt: ['$seller.username', 0] },
        totalSales: 1,
        totalRevenue: 1
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ];

  return db.collection<RechargeCard>(CARDS_COLLECTION).aggregate(pipeline).toArray();
}
