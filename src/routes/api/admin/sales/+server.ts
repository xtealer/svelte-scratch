import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getAllSales, getSalesByUser, getSalesStats, getTopSellers } from '$lib/server/db/sales';
import { ObjectId } from 'mongodb';

// GET - List sales (admin sees all, seller sees own)
export const GET: RequestHandler = async ({ cookies, url }) => {
  try {
    const user = requireAuth(cookies);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const filterSellerId = url.searchParams.get('sellerId');

    let sales;
    let stats;

    if (user.role === 'admin' || user.role === 'super') {
      // Admin/super can filter by seller or see all
      if (filterSellerId) {
        const sellerId = new ObjectId(filterSellerId);
        sales = await getSalesByUser(sellerId, limit);
        stats = await getSalesStats(sellerId);
      } else {
        sales = await getAllSales(limit);
        stats = await getSalesStats();
      }
    } else {
      // Seller can only see own sales
      const userId = new ObjectId(user.userId);
      sales = await getSalesByUser(userId, limit);
      stats = await getSalesStats(userId);
    }

    const topSellers = (user.role === 'admin' || user.role === 'super') ? await getTopSellers(5) : [];

    return json({
      sales: sales.map(s => ({
        _id: s._id?.toString(),
        code: s.code,
        plays: s.plays,
        price: s.price,
        sellerId: s.soldBy?.toString(),
        sellerName: s.sellerName,
        soldAt: s.soldAt
      })),
      stats,
      topSellers: topSellers.map(t => ({
        sellerName: t.sellerName,
        totalSales: t.totalSales,
        totalRevenue: t.totalRevenue
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message === 'Unauthorized') {
      return json({ error: message }, { status: 401 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};
