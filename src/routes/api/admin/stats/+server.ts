import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getSalesStats, getAllSales } from '$lib/server/db/sales';
import { getPayoutStats, getAllPayouts } from '$lib/server/db/payouts';
import { getCardStats } from '$lib/server/db/rechargeCards';
import { ObjectId } from 'mongodb';

// GET - Dashboard stats
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const user = requireAuth(cookies);

    const isAdmin = user.role === 'admin';
    const userId = new ObjectId(user.userId);

    const salesStats = await getSalesStats(isAdmin ? undefined : userId);
    const payoutStats = await getPayoutStats(isAdmin ? undefined : userId);
    const cardStats = isAdmin ? await getCardStats() : null;

    // Get recent data
    const recentSales = isAdmin
      ? await getAllSales(10)
      : [];

    const recentPayouts = isAdmin
      ? await getAllPayouts(10)
      : [];

    return json({
      sales: salesStats,
      payouts: payoutStats,
      cards: cardStats,
      recentSales: recentSales.map(s => ({
        code: s.code,
        price: s.price,
        sellerName: s.sellerName,
        soldAt: s.soldAt
      })),
      recentPayouts: recentPayouts.map(p => ({
        code: p.code,
        amount: p.amount,
        paidByName: p.paidByName,
        paidAt: p.paidAt
      })),
      netProfit: salesStats.totalRevenue - payoutStats.totalAmount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message === 'Unauthorized') {
      return json({ error: message }, { status: 401 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};
