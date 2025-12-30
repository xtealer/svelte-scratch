export interface PrizeConfig {
  amount: number;
  odds: number;
  prob?: number;
}

// Prize odds (~50% RTP, ~18% win rate)
// Based on 10,000 tickets = $5,000 total prizes
export const prizes: PrizeConfig[] = [
  { amount: 500, odds: 8945 },    // 1.1 in 10,000 ($560)
  { amount: 100, odds: 3334 },    // 3 in 10,000 ($300)
  { amount: 50, odds: 1243 },     // 8 in 10,000 ($402)
  { amount: 20, odds: 463 },      // 21.6 in 10,000 ($432)
  { amount: 10, odds: 173 },      // 57.8 in 10,000 ($578)
  { amount: 5, odds: 64 },        // 156 in 10,000 ($781)
  { amount: 2, odds: 24 },        // 417 in 10,000 ($833)
  { amount: 1, odds: 9 },         // 1,111 in 10,000 ($1,111)
  { amount: 0, odds: 0 },         // Loss
];

// Calculate probabilities
let totalProb = 0;
prizes.forEach((p) => {
  if (p.amount > 0) totalProb += 1 / p.odds;
});
const loseProb = 1 - totalProb;
prizes.forEach((p) => {
  p.prob = p.amount > 0 ? 1 / p.odds : loseProb;
});

export const symbolMap: Record<number, string> = {
  500: "💎",
  100: "⭐",
  50: "🎰",
  20: "💰",
  10: "🪙",
  5: "🪙",
  2: "🪶",
  1: "🪶",
};

export const loseSymbols: string[] = ["🪙", "💰", "💎", "🪶", "🎰", "⭐"];
export const nearMissPrizes: number[] = [500, 100, 100, 50, 50, 20, 20, 10, 10];

export function getPrize(): number {
  const rand = Math.random();
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += prize.prob!;
    if (rand < cumulative) {
      return prize.amount;
    }
  }
  return 0;
}

export function getWinSymbols(amount: number): string[] {
  const symbol = symbolMap[amount] || "🪶";
  return [symbol, symbol, symbol];
}

export function getLoseSymbols(): string[] {
  const shuffled = [...loseSymbols].sort(() => Math.random() - 0.5);
  let result = shuffled.slice(0, 3);
  // Make sure not all 3 are the same
  while (result[0] === result[1] && result[1] === result[2]) {
    result = [...loseSymbols].sort(() => Math.random() - 0.5).slice(0, 3);
  }
  return result;
}

export function getNearMissSymbols(): { symbols: string[]; nearMissAmount: number } {
  const nearMissAmount = nearMissPrizes[Math.floor(Math.random() * nearMissPrizes.length)];
  const winSymbol = symbolMap[nearMissAmount];
  const otherSymbols = loseSymbols.filter(s => s !== winSymbol);
  const randomOther = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
  return {
    symbols: [winSymbol, winSymbol, randomOther],
    nearMissAmount
  };
}
