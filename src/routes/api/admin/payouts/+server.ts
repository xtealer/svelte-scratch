import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import {
  recordPayout,
  getAllPayouts,
  getPayoutsByUser,
  getPayoutStats,
  getPayoutByCode
} from '$lib/server/db/payouts';
import { ObjectId } from 'mongodb';

// GET - List payouts (admin sees all, seller sees own)
export const GET: RequestHandler = async ({ cookies, url }) => {
  try {
    const user = requireAuth(cookies);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const code = url.searchParams.get('code');

    // Check specific code
    if (code) {
      const payout = await getPayoutByCode(code);
      return json({ payout });
    }

    let payouts;
    let stats;

    if (user.role === 'admin') {
      payouts = await getAllPayouts(limit);
      stats = await getPayoutStats();
    } else {
      const userId = new ObjectId(user.userId);
      payouts = await getPayoutsByUser(userId, limit);
      stats = await getPayoutStats(userId);
    }

    return json({
      payouts: payouts.map(p => ({
        _id: p._id?.toString(),
        code: p.code,
        amount: p.amount,
        paidByName: p.paidByName,
        paidAt: p.paidAt,
        notes: p.notes
      })),
      stats
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message === 'Unauthorized') {
      return json({ error: message }, { status: 401 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// POST - Record a payout
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = requireAuth(cookies);

    const { code, amount, notes } = await request.json();

    if (!code) {
      return json({ error: 'Code required' }, { status: 400 });
    }

    if (amount === undefined || amount <= 0) {
      return json({ error: 'Valid amount required' }, { status: 400 });
    }

    // Check if already paid
    const existing = await getPayoutByCode(code);
    if (existing) {
      return json({ error: 'Este código ya fue pagado' }, { status: 400 });
    }

    const payout = await recordPayout(
      code,
      amount,
      new ObjectId(user.userId),
      user.name,
      notes
    );

    return json({
      success: true,
      payout: {
        _id: payout._id?.toString(),
        code: payout.code,
        amount: payout.amount,
        paidAt: payout.paidAt
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message === 'Unauthorized') {
      return json({ error: message }, { status: 401 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};
