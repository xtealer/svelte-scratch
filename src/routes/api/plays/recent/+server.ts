import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import type { GamePlay } from '$lib/server/db/types';

const PLAYS_COLLECTION = 'gamePlays';

// Mask code to show only last 4 characters (done on backend for security)
function maskCode(code: string | undefined): string {
  if (!code || code.length < 4) return 'Hidden';
  return `****${code.slice(-4)}`;
}

export const GET: RequestHandler = async ({ url }) => {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  try {
    const db = await getDB();

    const plays = await db.collection<GamePlay>(PLAYS_COLLECTION)
      .find({})
      .sort({ playedAt: -1 })
      .limit(limit)
      .toArray();

    // Format plays for display - mask sensitive data on backend
    // Raw code is never sent to client
    const formattedPlays = plays.map(play => ({
      id: play._id?.toString(),
      game: play.gameId,
      time: play.playedAt,
      betAmount: play.betAmount,
      payout: play.prizeAmount,
      multiplier: play.betAmount > 0 ? (play.prizeAmount / play.betAmount).toFixed(2) : '0.00',
      isWin: play.prizeAmount > 0,
      user: maskCode(play.code)  // Masked on backend - full code never sent to client
    }));

    return json({ plays: formattedPlays });
  } catch (error) {
    console.error('Error fetching recent plays:', error);
    return json({ plays: [] });
  }
};
