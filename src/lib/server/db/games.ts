import { getDB } from './index';
import type { GameConfig } from './types';
import { ObjectId } from 'mongodb';

const COLLECTION = 'games';

// Default games with translations (used when creating new games)
const DEFAULT_GAMES: Omit<GameConfig, '_id'>[] = [
  {
    gameId: 'slots',
    name: {
      en: 'Slots',
      es: 'Tragamonedas',
      ar: 'سلوتس'
    },
    enabled: true,
    description: {
      en: 'Spin and win! Match symbols to win prizes.',
      es: '¡Gira y gana! Combina símbolos para ganar premios.',
      ar: 'دوّر واربح! طابق الرموز للفوز بالجوائز.'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'scratch',
    name: {
      en: 'Scratch & Win',
      es: 'Rasca y Gana',
      ar: 'اخدش واربح'
    },
    enabled: true,
    description: {
      en: 'Scratch to reveal your prize! Match 3 to win.',
      es: '¡Rasca para revelar tu premio! Combina 3 para ganar.',
      ar: 'اخدش لكشف جائزتك! طابق 3 للفوز.'
    },
    updatedAt: new Date()
  }
];

export async function ensureGamesExist(): Promise<void> {
  const db = await getDB();

  // Create any missing default games
  for (const game of DEFAULT_GAMES) {
    const exists = await db.collection<GameConfig>(COLLECTION).findOne({ gameId: game.gameId });
    if (!exists) {
      await db.collection<GameConfig>(COLLECTION).insertOne(game);
      console.log(`Created game config: ${game.gameId}`);
    }
  }
}

export async function getAllGames(): Promise<GameConfig[]> {
  const db = await getDB();
  return db.collection<GameConfig>(COLLECTION).find({}).toArray();
}

export async function getGame(gameId: string): Promise<GameConfig | null> {
  const db = await getDB();
  return db.collection<GameConfig>(COLLECTION).findOne({ gameId });
}

export async function isGameEnabled(gameId: string): Promise<boolean> {
  const game = await getGame(gameId);
  return game?.enabled ?? false;
}

export async function setGameEnabled(
  gameId: string,
  enabled: boolean,
  updatedBy?: ObjectId
): Promise<boolean> {
  const db = await getDB();
  const result = await db.collection<GameConfig>(COLLECTION).updateOne(
    { gameId },
    {
      $set: {
        enabled,
        updatedAt: new Date(),
        updatedBy
      }
    }
  );
  return result.modifiedCount > 0;
}

export async function updateGame(
  gameId: string,
  updates: Partial<Pick<GameConfig, 'name' | 'description' | 'enabled'>>,
  updatedBy?: ObjectId
): Promise<boolean> {
  const db = await getDB();
  const result = await db.collection<GameConfig>(COLLECTION).updateOne(
    { gameId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
        updatedBy
      }
    }
  );
  return result.modifiedCount > 0;
}
