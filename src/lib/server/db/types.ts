import type { ObjectId } from 'mongodb';

// Supported languages for translations
export type SupportedLanguage = 'en' | 'es' | 'ar';

// Translated text object
export type TranslatedText = Record<SupportedLanguage, string>;

// User roles
// super: can create admin and seller users
// admin: can only create seller users
// seller: cannot create any users
export type UserRole = 'super' | 'admin' | 'seller';

// Player user (customer account)
export interface PlayerUser {
  _id?: ObjectId;
  email: string;
  password: string; // hashed
  fullName: string;
  country: string;
  preferredLanguage: SupportedLanguage;
  metamaskAddress?: string; // linked Metamask wallet address
  active: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

// User account
export interface User {
  _id?: ObjectId;
  username: string;
  password: string; // hashed
  role: UserRole;
  name: string;
  active: boolean;
  createdAt: Date;
  createdBy?: ObjectId;
  lastLogin?: Date;
}

// Recharge card / Voucher
export interface RechargeCard {
  _id?: ObjectId;
  code: string;
  plays: number;
  price: number; // amount charged to customer
  used: boolean;
  usedAt?: Date;
  usedBySession?: string;
  createdAt: Date;
  createdBy: ObjectId; // seller or admin who created it
  soldAt?: Date;
  soldBy?: ObjectId;
  soldByName?: string;
}

// Game configuration
export interface GameConfig {
  _id?: ObjectId;
  gameId: string; // 'slots', 'scratch', etc.
  name: TranslatedText; // Translated game name
  enabled: boolean;
  description?: TranslatedText; // Translated description
  updatedAt: Date;
  updatedBy?: ObjectId;
}

// Sales transaction
export interface Sale {
  _id?: ObjectId;
  rechargeCardId: ObjectId;
  code: string;
  plays: number;
  price: number;
  sellerId: ObjectId;
  sellerName: string;
  soldAt: Date;
}

// Individual game play record
export interface GamePlay {
  _id?: ObjectId;
  sessionId: ObjectId;
  code: string;
  gameId: string;
  betAmount: number;
  prizeAmount: number;
  symbol: string;
  playedAt: Date;
}

// Game session / play record (per-game for stats)
export interface GameSession {
  _id?: ObjectId;
  code: string;
  gameId: string;
  startedAt: Date;
  endedAt?: Date;
  initialPlays: number;
  playsUsed: number;
  totalWinnings: number;
  claimed: boolean;
  claimedAt?: Date;
}

// Unified player session (cross-game wallet)
export interface PlayerSession {
  _id?: ObjectId;
  code: string;
  startedAt: Date;
  endedAt?: Date;
  initialCredits: number;   // Credits from the recharge card
  creditsUsed: number;      // Total credits consumed
  totalWinnings: number;    // Accumulated winnings across all games
  claimed: boolean;         // Whether winnings have been claimed
  claimedAt?: Date;
  lastGameId?: string;      // Last game played
}

// Payout request status
export type PayoutRequestStatus = 'pending' | 'approved' | 'rejected' | 'paid';

// Payout request from player
export interface PayoutRequest {
  _id?: ObjectId;
  code: string;
  gameId: string;
  amount: number;
  playerName: string;
  playerPhone: string;
  playerCountry: string;
  status: PayoutRequestStatus;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: ObjectId;
  processedByName?: string;
  sellerId?: ObjectId; // The seller who sold this code
  sellerName?: string;
  notes?: string;
}

// Payout type
export type PayoutType = 'cash' | 'credits';

// Payout record (completed payout)
export interface Payout {
  _id?: ObjectId;
  code: string;
  amount: number;
  payoutType: PayoutType;
  playerName: string;
  playerPhone: string;
  playerCountry: string;
  paidBy: ObjectId; // admin/seller who paid
  paidByName: string;
  paidAt: Date;
  requestId?: ObjectId;
  notes?: string;
}

// Credit conversion record (when player converts winnings to credits)
export interface CreditConversion {
  _id?: ObjectId;
  code: string;
  gameId: string;
  amount: number;
  playerName: string;
  playerPhone: string;
  playerCountry: string;
  convertedAt: Date;
  sellerId?: ObjectId;
  sellerName?: string;
}

// Prize stats for dashboard
export interface PrizeStats {
  prizeAmount: number;
  count: number;
  totalPaid: number;
  expectedOdds: number;
  actualOdds: number;
}

// Stats summary
export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalWinnings: number;
  totalPayouts: number;
  netProfit: number;
  activeCards: number;
  usedCards: number;
  recentSales: Sale[];
  recentPayouts: Payout[];
}
