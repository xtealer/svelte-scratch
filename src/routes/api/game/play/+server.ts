import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlayerToken, processPlayerGamePlay, getPlayerBalance } from '$lib/server/db/playerUsers';
import { calculatePrize, getPrizeSymbol } from '$lib/server/db/gameSessions';

// Wheel segment configurations
type SegmentConfig = { color: string; multiplier: number; count: number };

const wheelDifficultyConfigs: Record<string, Record<number, SegmentConfig[]>> = {
  easy: {
    10: [
      { color: '#ffd700', multiplier: 1.5, count: 4 },
      { color: '#00e701', multiplier: 1.2, count: 3 },
      { color: '#557086', multiplier: 0, count: 3 },
    ],
    20: [
      { color: '#ffd700', multiplier: 1.5, count: 6 },
      { color: '#00e701', multiplier: 1.2, count: 6 },
      { color: '#f7931a', multiplier: 2, count: 2 },
      { color: '#557086', multiplier: 0, count: 6 },
    ],
    30: [
      { color: '#ffd700', multiplier: 1.5, count: 8 },
      { color: '#00e701', multiplier: 1.2, count: 8 },
      { color: '#f7931a', multiplier: 2, count: 4 },
      { color: '#557086', multiplier: 0, count: 10 },
    ],
    40: [
      { color: '#ffd700', multiplier: 1.5, count: 10 },
      { color: '#00e701', multiplier: 1.2, count: 10 },
      { color: '#f7931a', multiplier: 2, count: 6 },
      { color: '#557086', multiplier: 0, count: 14 },
    ],
    50: [
      { color: '#ffd700', multiplier: 1.5, count: 12 },
      { color: '#00e701', multiplier: 1.2, count: 12 },
      { color: '#f7931a', multiplier: 2, count: 8 },
      { color: '#8b5cf6', multiplier: 3, count: 2 },
      { color: '#557086', multiplier: 0, count: 16 },
    ],
  },
  medium: {
    10: [
      { color: '#ffd700', multiplier: 2, count: 3 },
      { color: '#00e701', multiplier: 1.5, count: 2 },
      { color: '#557086', multiplier: 0, count: 5 },
    ],
    20: [
      { color: '#ffd700', multiplier: 2, count: 4 },
      { color: '#00e701', multiplier: 1.5, count: 4 },
      { color: '#f7931a', multiplier: 3, count: 2 },
      { color: '#557086', multiplier: 0, count: 10 },
    ],
    30: [
      { color: '#ffd700', multiplier: 2, count: 5 },
      { color: '#00e701', multiplier: 1.5, count: 6 },
      { color: '#f7931a', multiplier: 3, count: 3 },
      { color: '#8b5cf6', multiplier: 5, count: 1 },
      { color: '#557086', multiplier: 0, count: 15 },
    ],
    40: [
      { color: '#ffd700', multiplier: 2, count: 6 },
      { color: '#00e701', multiplier: 1.5, count: 8 },
      { color: '#f7931a', multiplier: 3, count: 4 },
      { color: '#8b5cf6', multiplier: 5, count: 2 },
      { color: '#557086', multiplier: 0, count: 20 },
    ],
    50: [
      { color: '#ffd700', multiplier: 2, count: 7 },
      { color: '#00e701', multiplier: 1.5, count: 10 },
      { color: '#f7931a', multiplier: 3, count: 5 },
      { color: '#8b5cf6', multiplier: 5, count: 3 },
      { color: '#fff', multiplier: 10, count: 1 },
      { color: '#557086', multiplier: 0, count: 24 },
    ],
  },
  hard: {
    10: [
      { color: '#ffd700', multiplier: 3, count: 2 },
      { color: '#00e701', multiplier: 2, count: 1 },
      { color: '#557086', multiplier: 0, count: 7 },
    ],
    20: [
      { color: '#ffd700', multiplier: 3, count: 2 },
      { color: '#00e701', multiplier: 2, count: 3 },
      { color: '#f7931a', multiplier: 5, count: 1 },
      { color: '#557086', multiplier: 0, count: 14 },
    ],
    30: [
      { color: '#ffd700', multiplier: 3, count: 3 },
      { color: '#00e701', multiplier: 2, count: 4 },
      { color: '#f7931a', multiplier: 5, count: 2 },
      { color: '#8b5cf6', multiplier: 10, count: 1 },
      { color: '#557086', multiplier: 0, count: 20 },
    ],
    40: [
      { color: '#ffd700', multiplier: 3, count: 4 },
      { color: '#00e701', multiplier: 2, count: 5 },
      { color: '#f7931a', multiplier: 5, count: 3 },
      { color: '#8b5cf6', multiplier: 10, count: 1 },
      { color: '#fff', multiplier: 20, count: 1 },
      { color: '#557086', multiplier: 0, count: 26 },
    ],
    50: [
      { color: '#ffd700', multiplier: 3, count: 5 },
      { color: '#00e701', multiplier: 2, count: 6 },
      { color: '#f7931a', multiplier: 5, count: 4 },
      { color: '#8b5cf6', multiplier: 10, count: 2 },
      { color: '#fff', multiplier: 50, count: 1 },
      { color: '#557086', multiplier: 0, count: 32 },
    ],
  },
};

// POST - Play a game (spin/scratch) using user's USDT balance
export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyPlayerToken(token);
    if (!payload || !payload.odSI) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const { gameId, bet = 1, rollOver, isRollOver, targetMultiplier, selectedSide, difficulty, segments } = await request.json();

    if (!gameId || !['slots', 'scratch', 'dice', 'limbo', 'flip', 'wheel'].includes(gameId)) {
      return json({ error: 'Invalid game' }, { status: 400 });
    }

    // Different bet validation for crypto games (allows smaller bets)
    const cryptoGames = ['dice', 'limbo', 'flip', 'wheel'];
    const minBet = cryptoGames.includes(gameId) ? 0.00000001 : 1;
    if (typeof bet !== 'number' || bet < minBet || bet > 10) {
      return json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    let prize = 0;
    let symbol = '';
    let diceResult: number | undefined;
    let limboResult: number | undefined;
    let flipResult: string | undefined;
    let wheelSegment: number | undefined;

    if (gameId === 'dice') {
      // Dice game logic
      if (typeof rollOver !== 'number' || rollOver < 0.01 || rollOver > 99.98) {
        return json({ error: 'Invalid roll over value' }, { status: 400 });
      }

      // Generate random result (0-99.99)
      diceResult = Math.random() * 100;

      // Calculate win chance and multiplier
      const winChance = isRollOver ? (99.99 - rollOver) : rollOver;
      const houseEdge = 0.01; // 1% house edge
      const multiplier = (100 - houseEdge * 100) / winChance;

      // Determine if player won
      const won = isRollOver ? (diceResult > rollOver) : (diceResult < rollOver);

      if (won) {
        prize = bet * multiplier;
      }
    } else if (gameId === 'limbo') {
      // Limbo game logic
      if (typeof targetMultiplier !== 'number' || targetMultiplier < 1.01) {
        return json({ error: 'Invalid target multiplier' }, { status: 400 });
      }

      const houseEdge = 0.01; // 1% house edge
      const winChance = (100 - houseEdge * 100) / targetMultiplier;

      // Generate a random result using inverse transform sampling
      // This creates a distribution where higher multipliers are rarer
      const random = Math.random() * 100;

      if (random < winChance) {
        // Win - generate a multiplier >= target
        limboResult = targetMultiplier + Math.random() * (targetMultiplier * 0.5);
        prize = bet * targetMultiplier;
      } else {
        // Lose - generate a multiplier < target
        limboResult = 1 + Math.random() * (targetMultiplier - 1.01);
      }
    } else if (gameId === 'flip') {
      // Flip (Coin) game logic
      if (!selectedSide || !['heads', 'tails'].includes(selectedSide)) {
        return json({ error: 'Invalid side selection' }, { status: 400 });
      }

      const houseEdge = 0.01; // 1% house edge
      const multiplier = 2 * (1 - houseEdge); // 1.98x

      // 50/50 flip
      flipResult = Math.random() < 0.5 ? 'heads' : 'tails';

      if (flipResult === selectedSide) {
        prize = bet * multiplier;
      }
    } else if (gameId === 'wheel') {
      // Wheel game logic
      if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
        return json({ error: 'Invalid difficulty' }, { status: 400 });
      }
      if (!segments || ![10, 20, 30, 40, 50].includes(segments)) {
        return json({ error: 'Invalid segments' }, { status: 400 });
      }

      // Build the wheel segments array
      const config = wheelDifficultyConfigs[difficulty][segments];
      const wheelSegments: Array<{ multiplier: number }> = [];

      for (const segment of config) {
        for (let i = 0; i < segment.count; i++) {
          wheelSegments.push({ multiplier: segment.multiplier });
        }
      }

      // Select random segment
      wheelSegment = Math.floor(Math.random() * wheelSegments.length);
      const winningMultiplier = wheelSegments[wheelSegment].multiplier;

      if (winningMultiplier > 0) {
        prize = bet * winningMultiplier;
      }
    } else {
      // Slots/Scratch game logic
      prize = calculatePrize(bet);
      symbol = getPrizeSymbol(prize);
    }

    // Process the play: deduct bet, add winnings, update wager
    const result = await processPlayerGamePlay(payload.odSI, bet, prize);

    if (!result.success) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({
      success: true,
      prize,
      symbol,
      result: diceResult ?? limboResult,
      flipResult,
      segment: wheelSegment,
      balance: result.newBalance,
      wagerRequired: result.wagerRequired,
      wagerCompleted: result.wagerCompleted,
      wagerMet: result.wagerMet
    });
  } catch (error) {
    console.error('Game play error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// GET - Get user's balance status
export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyPlayerToken(token);
    if (!payload || !payload.odSI) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const balance = await getPlayerBalance(payload.odSI);

    if (!balance) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    return json({
      balance: balance.balance,
      wagerRequired: balance.wagerRequired,
      wagerCompleted: balance.wagerCompleted,
      wagerMet: balance.wagerMet
    });
  } catch (error) {
    console.error('Balance status error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
