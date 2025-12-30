import type { ObjectId } from 'mongodb';

// User roles
// super: can create admin and seller users
// admin: can only create seller users
// seller: cannot create any users
export type UserRole = 'super' | 'admin' | 'seller';

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
  name: string;
  enabled: boolean;
  description?: string;
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

// Game session / play record
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

// Payout record (completed payout)
export interface Payout {
  _id?: ObjectId;
  code: string;
  amount: number;
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
