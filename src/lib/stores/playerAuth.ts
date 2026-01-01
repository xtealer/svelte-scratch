import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { SupportedLanguage } from '$lib/server/db/types';

const TOKEN_KEY = 'goldGames_playerToken';
const USER_KEY = 'goldGames_playerUser';

export interface PlayerAuthUser {
  odSI: string;
  email?: string; // Optional for MetaMask-only accounts
  fullName: string;
  country: string;
  preferredLanguage: SupportedLanguage;
  metamaskAddress?: string;
  usdtBalance?: number; // USDT balance for deposits
}

interface PlayerAuthState {
  user: PlayerAuthUser | null;
  token: string | null;
  loading: boolean;
}

const defaultState: PlayerAuthState = {
  user: null,
  token: null,
  loading: true
};

// Load from localStorage
function loadAuth(): PlayerAuthState {
  if (!browser) return { ...defaultState, loading: false };

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      const user = JSON.parse(userStr) as PlayerAuthUser;
      return { user, token, loading: false };
    }
  } catch {
    // Ignore parse errors
  }

  return { ...defaultState, loading: false };
}

// Create the store
function createPlayerAuthStore() {
  const { subscribe, set, update } = writable<PlayerAuthState>(defaultState);

  // Initialize from localStorage on client
  if (browser) {
    set(loadAuth());
  }

  return {
    subscribe,

    // Login with token and user data
    login: (token: string, user: PlayerAuthUser) => {
      const state: PlayerAuthState = { user, token, loading: false };
      set(state);
      if (browser) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    },

    // Logout
    logout: () => {
      set({ user: null, token: null, loading: false });
      if (browser) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    },

    // Update user data (e.g., after linking metamask)
    updateUser: (updates: Partial<PlayerAuthUser>) => {
      update(state => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...updates };
        const newState = { ...state, user: updatedUser };
        if (browser) {
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        }
        return newState;
      });
    },

    // Update USDT balance (for deposits, wins, and bets)
    updateBalance: (newBalance: number) => {
      update(state => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, usdtBalance: newBalance };
        const newState = { ...state, user: updatedUser };
        if (browser) {
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        }
        return newState;
      });
    },

    // Add to USDT balance (for deposits and wins)
    addBalance: (amount: number) => {
      update(state => {
        if (!state.user) return state;
        const currentBalance = state.user.usdtBalance ?? 0;
        const updatedUser = { ...state.user, usdtBalance: currentBalance + amount };
        const newState = { ...state, user: updatedUser };
        if (browser) {
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        }
        return newState;
      });
    },

    // Deduct from USDT balance (for bets)
    deductBalance: (amount: number) => {
      update(state => {
        if (!state.user) return state;
        const currentBalance = state.user.usdtBalance ?? 0;
        const newBalance = Math.max(0, currentBalance - amount);
        const updatedUser = { ...state.user, usdtBalance: newBalance };
        const newState = { ...state, user: updatedUser };
        if (browser) {
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        }
        return newState;
      });
    },

    // Get current state value
    get: () => get({ subscribe }),

    // Set loading state
    setLoading: (loading: boolean) => {
      update(state => ({ ...state, loading }));
    },

    // Check if authenticated
    isAuthenticated: () => {
      const state = get({ subscribe });
      return state.user !== null && state.token !== null;
    }
  };
}

export const playerAuth = createPlayerAuthStore();

// Derived store to check if player is logged in
export const isPlayerLoggedIn = derived(playerAuth, $auth =>
  $auth.user !== null && $auth.token !== null
);

// Derived store to get player user
export const playerUser = derived(playerAuth, $auth => $auth.user);

// Derived store to check if auth is loading
export const isAuthLoading = derived(playerAuth, $auth => $auth.loading);

// Derived store to get USDT balance
export const usdtBalance = derived(playerAuth, $auth => $auth.user?.usdtBalance ?? 0);

// Derived store to check if player can play (has balance)
export const canPlay = derived(playerAuth, $auth =>
  $auth.user !== null && ($auth.user.usdtBalance ?? 0) > 0
);
