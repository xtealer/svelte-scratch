import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  verifyPlayerToken,
  getPlayerTransactionHistory,
  getPlayerDeposits,
  getPlayerWithdrawals,
  getPlayerBetHistory
} from '$lib/server/db/playerUsers';

// GET - Get player's transaction history
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyPlayerToken(token);
    if (!payload) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse query parameters
    const filter = (url.searchParams.get('filter') || 'all') as 'all' | 'deposits' | 'withdrawals' | 'bets';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get transaction history based on filter
    if (filter === 'deposits') {
      const result = await getPlayerDeposits(payload.odSI, limit, offset);
      return json({
        transactions: result.deposits.map(d => ({
          id: d._id!.toString(),
          type: 'deposit' as const,
          amount: d.amount,
          createdAt: d.createdAt,
          details: {
            depositType: d.type,
            rechargeCode: d.rechargeCode,
            network: d.network,
            txHash: d.txHash
          }
        })),
        total: result.total
      });
    }

    if (filter === 'withdrawals') {
      const result = await getPlayerWithdrawals(payload.odSI, limit, offset);
      return json({
        transactions: result.withdrawals.map(w => ({
          id: w._id!.toString(),
          type: 'withdrawal' as const,
          amount: w.amount,
          status: w.status,
          createdAt: w.createdAt,
          details: {
            withdrawalType: w.type,
            network: w.network,
            walletAddress: w.walletAddress
          }
        })),
        total: result.total
      });
    }

    if (filter === 'bets') {
      const result = await getPlayerBetHistory(payload.odSI, limit, offset);
      return json({
        transactions: result.bets.map(b => ({
          id: b._id!.toString(),
          type: 'bet' as const,
          amount: b.betAmount,
          gameId: b.gameId,
          prizeAmount: b.prizeAmount,
          createdAt: b.playedAt,
          details: {
            symbol: b.symbol
          }
        })),
        total: result.total
      });
    }

    // Get all transactions combined
    const result = await getPlayerTransactionHistory(payload.odSI, filter, limit, offset);
    return json(result);
  } catch (error) {
    console.error('Transaction history error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
