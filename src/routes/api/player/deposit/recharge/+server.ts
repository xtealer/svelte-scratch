import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlayerToken, addToPlayerBalance, recordPlayerDeposit } from '$lib/server/db/playerUsers';
import { getRechargeCard, useRechargeCard } from '$lib/server/db/rechargeCards';

// POST - Deposit from a recharge card to user's USDT balance
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

    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return json({ error: 'Invalid code format' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();
    const card = await getRechargeCard(upperCode);

    if (!card) {
      return json({ error: 'Code not found' }, { status: 404 });
    }

    if (card.used) {
      return json({ error: 'Code already used' }, { status: 400 });
    }

    // Mark the card as used
    const usedCard = await useRechargeCard(upperCode);
    if (!usedCard) {
      return json({ error: 'Failed to use code' }, { status: 500 });
    }

    // Add the amount to user's USDT balance
    const result = await addToPlayerBalance(payload.odSI, usedCard.plays, true);

    if (!result.success) {
      return json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Record the deposit in history
    await recordPlayerDeposit(payload.odSI, 'recharge', usedCard.plays, {
      rechargeCode: upperCode
    });

    return json({
      success: true,
      amount: usedCard.plays,
      newBalance: result.newBalance,
      wagerRequired: result.wagerRequired,
      wagerCompleted: result.wagerCompleted,
      wagerMet: result.wagerCompleted >= result.wagerRequired,
      message: `Added $${usedCard.plays} to your balance!`
    });
  } catch (error) {
    console.error('Deposit recharge error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
