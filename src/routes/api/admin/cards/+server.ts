import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isAdminOrSuper, handleAuthError } from '$lib/server/auth';
import {
  createRechargeCard,
  createMultipleRechargeCards,
  getAllCards,
  getCardsByCreator,
  getCardStats,
  markCardAsSold
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
        plays: c.plays,
        price: c.price,
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

// POST - Create recharge card(s)
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = requireAuth(cookies);

    const { plays, price, count = 1 } = await request.json();

    if (!plays || plays < 1 || plays > 1000) {
      return json({ error: 'Plays must be between 1 and 1000' }, { status: 400 });
    }

    if (price === undefined || price < 0) {
      return json({ error: 'Price is required' }, { status: 400 });
    }

    if (count < 1 || count > 100) {
      return json({ error: 'Count must be between 1 and 100' }, { status: 400 });
    }

    const userId = new ObjectId(user.userId);

    let cards;
    if (count === 1) {
      const card = await createRechargeCard(plays, price, userId);
      cards = [card];
    } else {
      cards = await createMultipleRechargeCards(count, plays, price, userId);
    }

    return json({
      success: true,
      cards: cards.map(c => ({
        _id: c._id?.toString(),
        code: c.code,
        plays: c.plays,
        price: c.price
      }))
    });
  } catch (error) {
    return handleAuthError(error);
  }
};

// PATCH - Mark card as sold
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = requireAuth(cookies);

    const { code } = await request.json();

    if (!code) {
      return json({ error: 'Code required' }, { status: 400 });
    }

    const card = await markCardAsSold(
      code,
      new ObjectId(user.userId),
      user.name
    );

    if (!card) {
      return json({ error: 'Card not found' }, { status: 404 });
    }

    return json({
      success: true,
      card: {
        code: card.code,
        plays: card.plays,
        price: card.price,
        soldAt: card.soldAt
      }
    });
  } catch (error) {
    return handleAuthError(error);
  }
};
