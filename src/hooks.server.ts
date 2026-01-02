import type { Handle } from '@sveltejs/kit';
import { ensureGamesExist } from '$lib/server/db/games';

// Initialize database with all games on app start
let initialized = false;

async function initializeDatabase() {
  if (!initialized) {
    try {
      await ensureGamesExist();
      console.log('Database initialized: All games ensured to exist');
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}

// Run initialization on first request
export const handle: Handle = async ({ event, resolve }) => {
  await initializeDatabase();
  return resolve(event);
};
