import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  verifyPlayerToken,
  getPlayerUserById,
  deductFromPlayerBalance,
  recordPlayerWithdrawal,
  getPlayerBalance
} from '$lib/server/db/playerUsers';

// POST - Submit a withdrawal request
export const POST: RequestHandler = async ({ request }) => {
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

    const body = await request.json();
    const { type, amount, network, walletAddress, playerName, playerPhone, playerCountry } = body;

    // Validate required fields
    if (!type || !['crypto', 'cash'].includes(type)) {
      return json({ error: 'Invalid withdrawal type' }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get user and check balance
    const user = await getPlayerUserById(payload.odSI);
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    const balanceInfo = await getPlayerBalance(payload.odSI);
    if (!balanceInfo) {
      return json({ error: 'Failed to get balance info' }, { status: 500 });
    }

    // Check if wager requirement is met
    if (!balanceInfo.wagerMet) {
      return json({
        error: `Wager requirement not met. You need to wager $${(balanceInfo.wagerRequired - balanceInfo.wagerCompleted).toFixed(2)} more.`
      }, { status: 400 });
    }

    // Check if user has sufficient balance
    if (balanceInfo.balance < amount) {
      return json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct from balance
    const deductResult = await deductFromPlayerBalance(payload.odSI, amount);
    if (!deductResult.success) {
      return json({ error: deductResult.error || 'Failed to process withdrawal' }, { status: 500 });
    }

    // Record the withdrawal
    await recordPlayerWithdrawal(payload.odSI, type, amount, {
      network: type === 'crypto' ? network : undefined,
      walletAddress: type === 'crypto' ? walletAddress : undefined,
      playerName: type === 'cash' ? playerName : undefined,
      playerPhone: type === 'cash' ? playerPhone : undefined,
      playerCountry: type === 'cash' ? playerCountry : undefined
    });

    return json({
      success: true,
      newBalance: deductResult.newBalance,
      message: 'Withdrawal request submitted successfully'
    });
  } catch (error) {
    console.error('Withdrawal submit error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
