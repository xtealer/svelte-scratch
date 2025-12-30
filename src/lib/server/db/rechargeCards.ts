import { getDB } from './index';
import type { RechargeCard, Sale } from './types';
import { ObjectId } from 'mongodb';

const CARDS_COLLECTION = 'rechargeCards';
const SALES_COLLECTION = 'sales';

// Generate sequential code
async function generateCode(): Promise<string> {
  const db = await getDB();

  // Find the highest code number
  const lastCard = await db.collection<RechargeCard>(CARDS_COLLECTION)
    .find({})
    .sort({ code: -1 })
    .limit(1)
    .toArray();

  let nextNumber = 1;
  if (lastCard.length > 0) {
    const match = lastCard[0].code.match(/GOLD-001-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `GOLD-001-${nextNumber.toString().padStart(9, '0')}`;
}

export async function createRechargeCard(
  plays: number,
  price: number,
  createdBy: ObjectId
): Promise<RechargeCard> {
  const db = await getDB();

  if (plays < 1 || plays > 1000) {
    throw new Error('Plays must be between 1 and 1000');
  }

  const code = await generateCode();

  const card: RechargeCard = {
    code,
    plays,
    price,
    used: false,
    createdAt: new Date(),
    createdBy,
  };

  const result = await db.collection<RechargeCard>(CARDS_COLLECTION).insertOne(card);
  card._id = result.insertedId;

  return card;
}

export async function createMultipleRechargeCards(
  count: number,
  plays: number,
  price: number,
  createdBy: ObjectId
): Promise<RechargeCard[]> {
  const cards: RechargeCard[] = [];

  for (let i = 0; i < count; i++) {
    const card = await createRechargeCard(plays, price, createdBy);
    cards.push(card);
  }

  return cards;
}

export async function getRechargeCard(code: string): Promise<RechargeCard | null> {
  const db = await getDB();
  return db.collection<RechargeCard>(CARDS_COLLECTION).findOne({
    code: code.toUpperCase().trim()
  });
}

export async function useRechargeCard(code: string, sessionId?: string): Promise<RechargeCard | null> {
  const db = await getDB();
  const upperCode = code.toUpperCase().trim();

  const result = await db.collection<RechargeCard>(CARDS_COLLECTION).findOneAndUpdate(
    { code: upperCode, used: false },
    {
      $set: {
        used: true,
        usedAt: new Date(),
        usedBySession: sessionId
      }
    },
    { returnDocument: 'after' }
  );

  return result;
}

export async function markCardAsSold(
  code: string,
  sellerId: ObjectId,
  sellerName: string
): Promise<RechargeCard | null> {
  const db = await getDB();
  const upperCode = code.toUpperCase().trim();

  const card = await db.collection<RechargeCard>(CARDS_COLLECTION).findOneAndUpdate(
    { code: upperCode },
    {
      $set: {
        soldAt: new Date(),
        soldBy: sellerId
      }
    },
    { returnDocument: 'after' }
  );

  if (card) {
    // Record the sale
    const sale: Sale = {
      rechargeCardId: card._id!,
      code: card.code,
      plays: card.plays,
      price: card.price,
      sellerId,
      sellerName,
      soldAt: new Date()
    };

    await db.collection<Sale>(SALES_COLLECTION).insertOne(sale);
  }

  return card;
}

export async function getCardsByCreator(creatorId: ObjectId): Promise<RechargeCard[]> {
  const db = await getDB();
  return db.collection<RechargeCard>(CARDS_COLLECTION)
    .find({ createdBy: creatorId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getAllCards(limit = 100): Promise<RechargeCard[]> {
  const db = await getDB();
  return db.collection<RechargeCard>(CARDS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getUnusedCards(): Promise<RechargeCard[]> {
  const db = await getDB();
  return db.collection<RechargeCard>(CARDS_COLLECTION)
    .find({ used: false })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getCardStats() {
  const db = await getDB();
  const cards = await db.collection<RechargeCard>(CARDS_COLLECTION).find({}).toArray();

  return {
    total: cards.length,
    used: cards.filter(c => c.used).length,
    unused: cards.filter(c => !c.used).length,
    sold: cards.filter(c => c.soldAt).length,
    totalPlays: cards.reduce((sum, c) => sum + c.plays, 0),
    totalValue: cards.reduce((sum, c) => sum + c.price, 0),
    soldValue: cards.filter(c => c.soldAt).reduce((sum, c) => sum + c.price, 0),
  };
}
