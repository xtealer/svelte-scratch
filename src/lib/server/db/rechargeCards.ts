import { getDB } from './index';
import type { RechargeCard } from './types';
import { ObjectId } from 'mongodb';

const CARDS_COLLECTION = 'rechargeCards';

// Generate random unique code
async function generateCode(): Promise<string> {
  const db = await getDB();

  let code: string;
  let exists = true;

  // Keep generating until we find a unique code
  while (exists) {
    // Generate random 9-digit number
    const randomNum = Math.floor(Math.random() * 1000000000);
    code = `001-${randomNum.toString().padStart(9, '0')}`;

    // Check if code already exists
    const existing = await db.collection<RechargeCard>(CARDS_COLLECTION).findOne({ code });
    exists = !!existing;
  }

  return code!;
}

export async function createRechargeCard(
  amount: number,
  createdBy: ObjectId
): Promise<RechargeCard> {
  const db = await getDB();

  if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
    throw new Error('Amount must be an integer between 1 and 1000');
  }

  const code = await generateCode();

  // amount = plays = price (all the same value)
  // Card creation = sale (no separate sales collection needed)
  const card: RechargeCard = {
    code,
    plays: amount,
    price: amount,
    used: false,
    createdAt: new Date(),
    createdBy
  };

  const result = await db.collection<RechargeCard>(CARDS_COLLECTION).insertOne(card);
  card._id = result.insertedId;

  return card;
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

  const totalValue = cards.reduce((sum, c) => sum + c.price, 0);

  return {
    total: cards.length,
    used: cards.filter(c => c.used).length,
    unused: cards.filter(c => !c.used).length,
    sold: cards.length,  // All cards are sold (generation = sale)
    totalValue,
    soldValue: totalValue,  // All cards are sold
  };
}
