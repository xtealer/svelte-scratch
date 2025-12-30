import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isAdminOrSuper, handleAuthError } from '$lib/server/auth';
import {
  recordPayout,
  getAllPayouts,
  getPayoutsByUser,
  getPayoutStats,
  getPayoutByCode
} from '$lib/server/db/payouts';
import {
  getPayoutRequests,
  getPayoutRequestById,
  processPayoutRequest,
  getPayoutRequestStats
} from '$lib/server/db/gameSessions';
import { ObjectId } from 'mongodb';

// GET - List payouts and payout requests
export const GET: RequestHandler = async ({ cookies, url }) => {
  try {
    const user = requireAuth(cookies);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const code = url.searchParams.get('code');
    const type = url.searchParams.get('type') || 'all'; // 'payouts', 'requests', 'all'

    // Check specific code
    if (code) {
      const payout = await getPayoutByCode(code);
      return json({ payout });
    }

    const userId = new ObjectId(user.userId);
    const isAdmin = isAdminOrSuper(user);

    let payouts = [];
    let stats = null;
    let requests = [];
    let requestStats = null;

    if (type === 'all' || type === 'payouts') {
      if (isAdmin) {
        payouts = await getAllPayouts(limit);
        stats = await getPayoutStats();
      } else {
        payouts = await getPayoutsByUser(userId, limit);
        stats = await getPayoutStats(userId);
      }
    }

    if (type === 'all' || type === 'requests') {
      requests = await getPayoutRequests(userId, user.role, limit);
      requestStats = await getPayoutRequestStats(userId, user.role);
    }

    return json({
      payouts: payouts.map(p => ({
        _id: p._id?.toString(),
        code: p.code,
        amount: p.amount,
        playerName: p.playerName,
        playerPhone: p.playerPhone,
        paidByName: p.paidByName,
        paidAt: p.paidAt,
        notes: p.notes
      })),
      stats,
      requests: requests.map(r => ({
        _id: r._id?.toString(),
        code: r.code,
        gameId: r.gameId,
        amount: r.amount,
        playerName: r.playerName,
        playerPhone: r.playerPhone,
        playerCountry: r.playerCountry,
        status: r.status,
        createdAt: r.createdAt,
        processedAt: r.processedAt,
        processedByName: r.processedByName,
        sellerName: r.sellerName,
        notes: r.notes
      })),
      requestStats
    });
  } catch (error) {
    return handleAuthError(error);
  }
};

// POST - Record a payout (from manual entry or processing a request)
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = requireAuth(cookies);

    const { code, amount, notes, requestId, playerName, playerPhone, playerCountry } = await request.json();

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
      notes,
      playerName,
      playerPhone,
      playerCountry,
      requestId ? new ObjectId(requestId) : undefined
    );

    // If processing a request, mark it as paid
    if (requestId) {
      await processPayoutRequest(
        new ObjectId(requestId),
        new ObjectId(user.userId),
        user.name,
        'paid',
        notes
      );
    }

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
    return handleAuthError(error);
  }
};

// PATCH - Process a payout request (approve, reject, pay)
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = requireAuth(cookies);

    const { requestId, action, notes } = await request.json();

    if (!requestId) {
      return json({ error: 'Request ID required' }, { status: 400 });
    }

    if (!action || !['approve', 'reject', 'pay'].includes(action)) {
      return json({ error: 'Valid action required (approve/reject/pay)' }, { status: 400 });
    }

    // Check if seller can only process their own requests
    const payoutRequest = await getPayoutRequestById(new ObjectId(requestId));
    if (!payoutRequest) {
      return json({ error: 'Request not found' }, { status: 404 });
    }

    // Sellers can only process their own requests
    if (user.role === 'seller') {
      if (!payoutRequest.sellerId || payoutRequest.sellerId.toString() !== user.userId) {
        return json({ error: 'You can only process your own requests' }, { status: 403 });
      }
    }

    // Map action to status
    const statusMap: Record<string, string> = {
      'approve': 'approved',
      'reject': 'rejected',
      'pay': 'paid'
    };
    const status = statusMap[action];

    // If paying, also record the payout
    if (action === 'pay') {
      // Check if already paid
      const existing = await getPayoutByCode(payoutRequest.code);
      if (existing) {
        return json({ error: 'This code was already paid' }, { status: 400 });
      }

      // Record the payout
      await recordPayout(
        payoutRequest.code,
        payoutRequest.amount,
        new ObjectId(user.userId),
        user.name,
        notes,
        payoutRequest.playerName,
        payoutRequest.playerPhone,
        payoutRequest.playerCountry,
        payoutRequest._id
      );
    }

    const result = await processPayoutRequest(
      new ObjectId(requestId),
      new ObjectId(user.userId),
      user.name,
      status,
      notes
    );

    if (!result) {
      return json({ error: 'Failed to process request' }, { status: 400 });
    }

    return json({
      success: true,
      request: {
        _id: result._id?.toString(),
        status: result.status,
        processedAt: result.processedAt,
        processedByName: result.processedByName
      }
    });
  } catch (error) {
    return handleAuthError(error);
  }
};
