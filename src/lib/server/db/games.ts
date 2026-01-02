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
  },
  {
    gameId: 'dice',
    name: {
      en: 'Dice',
      es: 'Dados',
      ar: 'نرد'
    },
    enabled: true,
    description: {
      en: 'Roll the dice and bet on the outcome!',
      es: '¡Tira los dados y apuesta por el resultado!',
      ar: 'ارمِ النرد وراهن على النتيجة!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'limbo',
    name: {
      en: 'Limbo',
      es: 'Limbo',
      ar: 'ليمبو'
    },
    enabled: true,
    description: {
      en: 'Set your target multiplier and test your luck!',
      es: '¡Establece tu multiplicador objetivo y prueba tu suerte!',
      ar: 'حدد المضاعف المستهدف واختبر حظك!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'flip',
    name: {
      en: 'Coin Flip',
      es: 'Lanzar Moneda',
      ar: 'قلب العملة'
    },
    enabled: true,
    description: {
      en: 'Heads or tails? Pick a side and flip!',
      es: '¿Cara o cruz? ¡Elige un lado y lanza!',
      ar: 'صورة أم كتابة؟ اختر جانبًا واقلب!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'wheel',
    name: {
      en: 'Wheel',
      es: 'Rueda',
      ar: 'عجلة'
    },
    enabled: true,
    description: {
      en: 'Spin the wheel and win multipliers!',
      es: '¡Gira la rueda y gana multiplicadores!',
      ar: 'أدر العجلة واربح مضاعفات!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'crash',
    name: {
      en: 'Crash',
      es: 'Crash',
      ar: 'كراش'
    },
    enabled: true,
    description: {
      en: 'Cash out before the crash! How high can you go?',
      es: '¡Retira antes del crash! ¿Qué tan alto puedes llegar?',
      ar: 'اسحب قبل الانهيار! إلى أي ارتفاع يمكنك الوصول؟'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'mines',
    name: {
      en: 'Mines',
      es: 'Minas',
      ar: 'ألغام'
    },
    enabled: true,
    description: {
      en: 'Reveal gems and avoid the mines!',
      es: '¡Revela gemas y evita las minas!',
      ar: 'اكشف الجواهر وتجنب الألغام!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'keno',
    name: {
      en: 'Keno',
      es: 'Keno',
      ar: 'كينو'
    },
    enabled: true,
    description: {
      en: 'Pick your numbers and match to win!',
      es: '¡Elige tus números y combina para ganar!',
      ar: 'اختر أرقامك وطابقها للفوز!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'chickenroad',
    name: {
      en: 'Chicken Road',
      es: 'Camino del Pollo',
      ar: 'طريق الدجاجة'
    },
    enabled: true,
    description: {
      en: 'Help the chicken cross safely for bigger rewards!',
      es: '¡Ayuda al pollo a cruzar seguro para mayores recompensas!',
      ar: 'ساعد الدجاجة على العبور بأمان للحصول على مكافآت أكبر!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'blackjack',
    name: {
      en: 'Blackjack',
      es: 'Blackjack',
      ar: 'بلاك جاك'
    },
    enabled: true,
    description: {
      en: 'Beat the dealer to 21 without going bust!',
      es: '¡Vence al crupier llegando a 21 sin pasarte!',
      ar: 'اهزم الموزع للوصول إلى 21 دون أن تخسر!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'baccarat',
    name: {
      en: 'Baccarat',
      es: 'Baccarat',
      ar: 'باكاراه'
    },
    enabled: true,
    description: {
      en: 'Bet on Player, Banker, or Tie!',
      es: '¡Apuesta por el Jugador, la Banca o Empate!',
      ar: 'راهن على اللاعب أو البنك أو التعادل!'
    },
    updatedAt: new Date()
  },
  {
    gameId: 'bingo',
    name: {
      en: 'Live Bingo',
      es: 'Bingo en Vivo',
      ar: 'بينغو مباشر'
    },
    enabled: true,
    description: {
      en: 'Match numbers and win in real-time!',
      es: '¡Combina números y gana en tiempo real!',
      ar: 'طابق الأرقام واربح في الوقت الفعلي!'
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
