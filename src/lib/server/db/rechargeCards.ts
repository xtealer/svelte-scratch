import { getDB } from './index';
import type { RechargeCard, Sale } from './types';
import { ObjectId } from 'mongodb';

const CARDS_COLLECTION = 'rechargeCards';
const SALES_COLLECTION = 'sales';

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
  createdBy: ObjectId,
  sellerName: string
): Promise<RechargeCard> {
  const db = await getDB();

  if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
    throw new Error('Amount must be an integer between 1 and 1000');
  }

  const code = await generateCode();
  const now = new Date();

  // amount = plays = price (all the same value)
  // Card is automatically sold when generated
  const card: RechargeCard = {
    code,
    plays: amount,
    price: amount,
    used: false,
    createdAt: now,
    createdBy,
    soldAt: now,  // Automatically sold on creation
    soldBy: createdBy
  };

  const result = await db.collection<RechargeCard>(CARDS_COLLECTION).insertOne(card);
  card._id = result.insertedId;

  // Create the sale record automatically
  const sale: Sale = {
    rechargeCardId: card._id,
    code: card.code,
    plays: card.plays,
    price: card.price,
    sellerId: createdBy,
    sellerName,
    soldAt: now
  };

  await db.collection<Sale>(SALES_COLLECTION).insertOne(sale);

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

  return {
    total: cards.length,
    used: cards.filter(c => c.used).length,
    unused: cards.filter(c => !c.used).length,
    sold: cards.filter(c => c.soldAt).length,
    totalValue: cards.reduce((sum, c) => sum + c.price, 0),
    soldValue: cards.filter(c => c.soldAt).reduce((sum, c) => sum + c.price, 0),
  };
}

// Sync historical cards to sales - creates Sale records for all cards that don't have them
// Since card generation = sale, all cards should have a corresponding Sale record
export async function syncCardsToSales(): Promise<{ synced: number; skipped: number }> {
  const db = await getDB();

  // Find ALL cards (since generation = sale)
  const allCards = await db.collection<RechargeCard>(CARDS_COLLECTION)
    .find({})
    .toArray();

  let synced = 0;
  let skipped = 0;

  for (const card of allCards) {
    // Check if a sale record already exists for this card
    const existingSale = await db.collection<Sale>(SALES_COLLECTION).findOne({
      rechargeCardId: card._id
    });

    if (existingSale) {
      skipped++;
      continue;
    }

    // Get the creator info
    const creator = await db.collection('users').findOne({ _id: card.createdBy });

    // Create the sale record - use createdAt since generation = sale
    const sale: Sale = {
      rechargeCardId: card._id!,
      code: card.code,
      plays: card.plays,
      price: card.price,
      sellerId: card.createdBy,
      sellerName: creator?.username || 'Unknown',
      soldAt: card.createdAt
    };

    await db.collection<Sale>(SALES_COLLECTION).insertOne(sale);

    // Also update the card to have soldAt if it doesn't
    if (!card.soldAt) {
      await db.collection<RechargeCard>(CARDS_COLLECTION).updateOne(
        { _id: card._id },
        { $set: { soldAt: card.createdAt } }
      );
    }

    synced++;
  }

  return { synced, skipped };
}
