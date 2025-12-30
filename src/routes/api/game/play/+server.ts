import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRechargeCard } from '$lib/server/db/rechargeCards';
import { getOrCreateSession, recordPlay, getSessionStatus, getPrizeSymbol } from '$lib/server/db/gameSessions';

// POST - Play a game (spin/scratch)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, gameId, bet = 1 } = await request.json();

    if (!code || typeof code !== 'string') {
      return json({ error: 'Invalid code' }, { status: 400 });
    }

    if (!gameId || !['slots', 'scratch'].includes(gameId)) {
      return json({ error: 'Invalid game' }, { status: 400 });
    }

    if (typeof bet !== 'number' || bet < 1 || bet > 10) {
      return json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();

    // Record the play and get result
    const result = await recordPlay(upperCode, gameId, bet);

    if (!result.success) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({
      success: true,
      prize: result.prize,
      symbol: result.symbol,
      playsLeft: result.playsLeft,
      totalWinnings: result.totalWinnings
    });
  } catch (error) {
    console.error('Game play error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// GET - Get session status
export const GET: RequestHandler = async ({ url }) => {
  try {
    const code = url.searchParams.get('code');
    const gameId = url.searchParams.get('gameId');

    if (!code) {
      return json({ error: 'Code required' }, { status: 400 });
    }

    if (!gameId || !['slots', 'scratch'].includes(gameId)) {
      return json({ error: 'Valid gameId required' }, { status: 400 });
    }

    const status = await getSessionStatus(code, gameId);

    if (!status) {
      return json({ exists: false });
    }

    return json(status);
  } catch (error) {
    console.error('Session status error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
