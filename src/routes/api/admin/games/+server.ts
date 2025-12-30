import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin, getAuthUser } from '$lib/server/auth';
import { getAllGames, updateGame } from '$lib/server/db/games';
import { ObjectId } from 'mongodb';

// GET - List all games
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const user = getAuthUser(cookies);
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

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
  } catch {
    return json({ error: 'Server error' }, { status: 500 });
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

    const updates: Record<string, unknown> = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const success = await updateGame(
      gameId,
      updates as { name?: string; description?: string; enabled?: boolean },
      new ObjectId(admin.userId)
    );

    if (!success) {
      return json({ error: 'Game not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message === 'Unauthorized' || message === 'Admin access required') {
      return json({ error: message }, { status: 403 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};
