import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isAdminOrSuper, handleAuthError } from '$lib/server/auth';
import {
  createRechargeCard,
  getAllCards,
  getCardsByCreator,
  getCardStats
} from '$lib/server/db/rechargeCards';
import { ObjectId } from 'mongodb';

// GET - List cards (admin/super sees all, seller sees own)
export const GET: RequestHandler = async ({ cookies, url }) => {
  try {
    const user = requireAuth(cookies);
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let cards;
    if (isAdminOrSuper(user)) {
      cards = await getAllCards(limit);
    } else {
      cards = await getCardsByCreator(new ObjectId(user.userId));
    }

    const stats = await getCardStats();

    return json({
      cards: cards.map(c => ({
        _id: c._id?.toString(),
        code: c.code,
        amount: c.price, // amount = price = plays
        used: c.used,
        usedAt: c.usedAt,
        createdAt: c.createdAt,
        soldAt: c.soldAt
      })),
      stats
    });
  } catch (error) {
    return handleAuthError(error);
  }
};

// POST - Create recharge card
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = requireAuth(cookies);

    const { amount } = await request.json();

    // Validate amount is a positive integer between 1 and 1000
    if (!amount || !Number.isInteger(amount) || amount < 1 || amount > 1000) {
      return json({ error: 'Amount must be an integer between 1 and 1000' }, { status: 400 });
    }

    const userId = new ObjectId(user.userId);
    const card = await createRechargeCard(amount, userId);

    return json({
      success: true,
      card: {
        _id: card._id?.toString(),
        code: card.code,
        amount: card.price
      }
    });
  } catch (error) {
    return handleAuthError(error);
  }
};
