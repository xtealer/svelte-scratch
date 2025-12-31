import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, requireAdmin, handleAuthError } from '$lib/server/auth';
import { getAllGames, updateGame } from '$lib/server/db/games';
import type { TranslatedText } from '$lib/server/db/types';
import { ObjectId } from 'mongodb';

// GET - List all games (any authenticated user)
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    requireAuth(cookies);

    const games = await getAllGames();

    return json({
      games: games.map(g => ({
        gameId: g.gameId,
        name: g.name,
        enabled: g.enabled,
        description: g.description,
        updatedAt: g.updatedAt
      }))
    });
  } catch (error) {
    return handleAuthError(error);
  }
};

// PATCH - Update game settings (admin only)
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const admin = requireAdmin(cookies);

    const { gameId, enabled, name, description } = await request.json();

    if (!gameId) {
      return json({ error: 'Game ID required' }, { status: 400 });
    }

    const updates: { enabled?: boolean; name?: TranslatedText; description?: TranslatedText } = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const success = await updateGame(
      gameId,
      updates,
      new ObjectId(admin.userId)
    );

    if (!success) {
      return json({ error: 'Game not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
};
