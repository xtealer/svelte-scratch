import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'goldGames_wallet';

export interface PlayerWallet {
  code: string;
  credits: number;
  winnings: number;
  lastGameId: string;
  // Wager requirement tracking
  wagerRequired: number;
  wagerCompleted: number;
}

const defaultWallet: PlayerWallet = {
  code: '',
  credits: 0,
  winnings: 0,
  lastGameId: '',
  wagerRequired: 0,
  wagerCompleted: 0
};

// Load from localStorage
function loadWallet(): PlayerWallet {
  if (!browser) return defaultWallet;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const wallet = JSON.parse(saved);
      // Only restore if there are credits or winnings
      if (wallet.credits > 0 || wallet.winnings > 0) {
        return wallet;
      }
    }
  } catch {
    // Ignore parse errors
  }

  return defaultWallet;
}

// Create the store
function createWalletStore() {
  const { subscribe, set, update } = writable<PlayerWallet>(defaultWallet);

  // Initialize from localStorage on client
  if (browser) {
    set(loadWallet());
  }

  return {
    subscribe,

    // Load a new code with credits
    loadCode: (code: string, credits: number, winnings: number = 0, gameId: string = '', wagerRequired: number = 0, wagerCompleted: number = 0) => {
      const wallet: PlayerWallet = {
        code: code.toUpperCase().trim(),
        credits,
        winnings,
        lastGameId: gameId,
        wagerRequired,
        wagerCompleted
      };
      set(wallet);
      if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
      }
    },

    // Update credits after a play
    updateCredits: (credits: number, winnings: number, wagerCompleted?: number) => {
      update(w => {
        const updated = {
          ...w,
          credits,
          winnings,
          ...(wagerCompleted !== undefined && { wagerCompleted })
        };
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },

    // Add winnings to the wallet
    addWinnings: (amount: number) => {
      update(w => {
        const updated = { ...w, winnings: w.winnings + amount };
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },

    // Convert winnings to credits
    convertWinningsToCredits: () => {
      update(w => {
        if (w.winnings <= 0) return w;
        const updated = {
          ...w,
          credits: w.credits + Math.floor(w.winnings),
          winnings: 0
        };
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },

    // Set the last game played
    setLastGame: (gameId: string) => {
      update(w => {
        const updated = { ...w, lastGameId: gameId };
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },

    // Clear the wallet (end session)
    clear: () => {
      set(defaultWallet);
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
        // Also clear old per-game sessions for migration
        localStorage.removeItem('goldRush_session');
        localStorage.removeItem('goldSlots_session');
      }
    },

    // Get current wallet value
    get: () => get({ subscribe })
  };
}

export const playerWallet = createWalletStore();

// Derived store to check if there's an active session
export const hasActiveSession = derived(playerWallet, $wallet =>
  $wallet.code !== '' && ($wallet.credits > 0 || $wallet.winnings > 0)
);

// Derived store to get total balance (credits + winnings)
export const totalBalance = derived(playerWallet, $wallet =>
  $wallet.credits + $wallet.winnings
);

// Derived store to check if wager requirement is met
export const wagerMet = derived(playerWallet, $wallet =>
  $wallet.wagerRequired === 0 || $wallet.wagerCompleted >= $wallet.wagerRequired
);

// Derived store to get wager progress percentage
export const wagerProgress = derived(playerWallet, $wallet =>
  $wallet.wagerRequired > 0
    ? Math.min(100, ($wallet.wagerCompleted / $wallet.wagerRequired) * 100)
    : 100
);

// Derived store to get remaining wager amount
export const wagerRemaining = derived(playerWallet, $wallet =>
  Math.max(0, $wallet.wagerRequired - $wallet.wagerCompleted)
);
