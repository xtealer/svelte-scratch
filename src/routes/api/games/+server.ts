import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllGames } from '$lib/server/db/games';

// GET - List all enabled games (public endpoint)
export const GET: RequestHandler = async () => {
  try {
    const games = await getAllGames();

    // Only return enabled games for public display
    const enabledGames = games
      .filter((g) => g.enabled)
      .map((g) => ({
        gameId: g.gameId,
        name: g.name,
        description: g.description
      }));

    return json({ games: enabledGames });
  } catch (error) {
    console.error('Failed to fetch games:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
