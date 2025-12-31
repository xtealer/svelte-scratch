import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import type { GamePlay } from '$lib/server/db/types';

const PLAYS_COLLECTION = 'gamePlays';

export const GET: RequestHandler = async ({ url }) => {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  try {
    const db = await getDB();

    const plays = await db.collection<GamePlay>(PLAYS_COLLECTION)
      .find({})
      .sort({ playedAt: -1 })
      .limit(limit)
      .toArray();

    // Format plays for display (hide sensitive data)
    const formattedPlays = plays.map(play => ({
      id: play._id?.toString(),
      game: play.gameId,
      time: play.playedAt,
      betAmount: play.betAmount,
      payout: play.prizeAmount,
      multiplier: play.betAmount > 0 ? (play.prizeAmount / play.betAmount).toFixed(2) : '0.00',
      isWin: play.prizeAmount > 0,
      // Hide full code, show only last 4 chars
      user: play.code ? `****${play.code.slice(-4)}` : 'Hidden'
    }));

    return json({ plays: formattedPlays });
  } catch (error) {
    console.error('Error fetching recent plays:', error);
    return json({ plays: [] });
  }
};
