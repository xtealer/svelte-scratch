import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isAdminOrSuper, handleAuthError } from '$lib/server/auth';
import { getSalesStats, getAllSales } from '$lib/server/db/sales';
import { getPayoutStats, getAllPayouts } from '$lib/server/db/payouts';
import { getCardStats } from '$lib/server/db/rechargeCards';
import { getPrizeStats, getPlaysBreakdown, getPayoutRequestStats } from '$lib/server/db/gameSessions';
import { ObjectId } from 'mongodb';

// GET - Dashboard stats
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const user = requireAuth(cookies);

    const isAdmin = isAdminOrSuper(user);
    const userId = new ObjectId(user.userId);

    const salesStats = await getSalesStats(isAdmin ? undefined : userId);
    const payoutStats = await getPayoutStats(isAdmin ? undefined : userId);
    const cardStats = isAdmin ? await getCardStats() : null;

    // Get prize and plays stats for admins
    const prizeStats = isAdmin ? await getPrizeStats() : null;
    const playsBreakdown = isAdmin ? await getPlaysBreakdown() : null;

    // Get payout request stats
    const payoutRequestStats = await getPayoutRequestStats(userId, user.role);

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
      prizeStats,
      playsBreakdown,
      payoutRequests: payoutRequestStats,
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
    return handleAuthError(error);
  }
};
