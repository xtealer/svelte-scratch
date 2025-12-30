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

// Payout record
export interface Payout {
  _id?: ObjectId;
  code: string;
  amount: number;
  paidBy: ObjectId; // admin/seller who paid
  paidByName: string;
  paidAt: Date;
  notes?: string;
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
