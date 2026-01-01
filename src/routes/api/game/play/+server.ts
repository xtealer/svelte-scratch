import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlayerToken, processPlayerGamePlay, getPlayerBalance } from '$lib/server/db/playerUsers';
import { calculatePrize, getPrizeSymbol } from '$lib/server/db/gameSessions';

// POST - Play a game (spin/scratch) using user's USDT balance
export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyPlayerToken(token);
    if (!payload || !payload.odSI) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const { gameId, bet = 1 } = await request.json();

    if (!gameId || !['slots', 'scratch'].includes(gameId)) {
      return json({ error: 'Invalid game' }, { status: 400 });
    }

    if (typeof bet !== 'number' || bet < 1 || bet > 10) {
      return json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    // Calculate prize
    const prize = calculatePrize(bet);
    const symbol = getPrizeSymbol(prize);

    // Process the play: deduct bet, add winnings, update wager
    const result = await processPlayerGamePlay(payload.odSI, bet, prize);

    if (!result.success) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({
      success: true,
      prize,
      symbol,
      balance: result.newBalance,
      wagerRequired: result.wagerRequired,
      wagerCompleted: result.wagerCompleted,
      wagerMet: result.wagerMet
    });
  } catch (error) {
    console.error('Game play error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// GET - Get user's balance status
export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyPlayerToken(token);
    if (!payload || !payload.odSI) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const balance = await getPlayerBalance(payload.odSI);

    if (!balance) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    return json({
      balance: balance.balance,
      wagerRequired: balance.wagerRequired,
      wagerCompleted: balance.wagerCompleted,
      wagerMet: balance.wagerMet
    });
  } catch (error) {
    console.error('Balance status error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
