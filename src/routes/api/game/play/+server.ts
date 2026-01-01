import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlayerToken, processPlayerGamePlay, getPlayerBalance } from '$lib/server/db/playerUsers';
import { calculatePrize, getPrizeSymbol } from '$lib/server/db/gameSessions';

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

    const { gameId, bet = 1, rollOver, isRollOver } = await request.json();

    if (!gameId || !['slots', 'scratch', 'dice'].includes(gameId)) {
      return json({ error: 'Invalid game' }, { status: 400 });
    }

    // Different bet validation for dice (allows smaller bets)
    const minBet = gameId === 'dice' ? 0.00000001 : 1;
    if (typeof bet !== 'number' || bet < minBet || bet > 10) {
      return json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    let prize = 0;
    let symbol = '';
    let diceResult: number | undefined;

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
      result: diceResult,
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
