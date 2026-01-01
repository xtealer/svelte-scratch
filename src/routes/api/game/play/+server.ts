import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recordPlayerPlay, getPlayerSessionStatus } from '$lib/server/db/gameSessions';

// POST - Play a game (spin/scratch) using unified player session
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

    // Record the play using unified player session (cross-game)
    const result = await recordPlayerPlay(upperCode, gameId, bet);

    if (!result.success) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({
      success: true,
      prize: result.prize,
      symbol: result.symbol,
      playsLeft: result.creditsLeft,  // Use creditsLeft instead of playsLeft
      totalWinnings: result.totalWinnings,
      wagerRequired: result.wagerRequired,
      wagerCompleted: result.wagerCompleted,
      wagerMet: result.wagerMet
    });
  } catch (error) {
    console.error('Game play error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// GET - Get unified player session status
export const GET: RequestHandler = async ({ url }) => {
  try {
    const code = url.searchParams.get('code');

    if (!code) {
      return json({ error: 'Code required' }, { status: 400 });
    }

    const status = await getPlayerSessionStatus(code);

    if (!status) {
      return json({ exists: false });
    }

    return json({
      exists: status.exists,
      playsLeft: status.creditsLeft,  // Alias for compatibility
      creditsLeft: status.creditsLeft,
      totalWinnings: status.totalWinnings,
      claimed: status.claimed,
      lastGameId: status.lastGameId,
      wagerRequired: status.wagerRequired,
      wagerCompleted: status.wagerCompleted,
      wagerMet: status.wagerMet
    });
  } catch (error) {
    console.error('Session status error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
