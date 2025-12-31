import { browser } from '$app/environment';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'win' | 'bigWin' | 'error' | 'success';

interface HapticSettings {
  enabled: boolean;
}

const STORAGE_KEY = 'goldGames_haptics';

// Haptic patterns in milliseconds
const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  win: [50, 50, 100],
  bigWin: [100, 50, 100, 50, 200],
  error: [50, 100, 50],
  success: [30, 50, 30]
};

// Check if vibration is supported
function isSupported(): boolean {
  return browser && 'vibrate' in navigator;
}

// Load settings from localStorage
function loadSettings(): HapticSettings {
  if (!browser) return { enabled: true };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }

  return { enabled: true };
}

// Save settings to localStorage
function saveSettings(settings: HapticSettings): void {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

let settings = loadSettings();

/**
 * Trigger haptic feedback with a specific pattern
 */
export function haptic(pattern: HapticPattern = 'medium'): void {
  if (!isSupported() || !settings.enabled) return;

  const vibrationPattern = patterns[pattern];
  navigator.vibrate(vibrationPattern);
}

/**
 * Trigger haptic feedback for a win based on amount
 */
export function hapticWin(amount: number): void {
  if (!isSupported() || !settings.enabled) return;

  if (amount >= 100) {
    navigator.vibrate(patterns.bigWin);
  } else if (amount >= 10) {
    navigator.vibrate(patterns.win);
  } else if (amount > 0) {
    navigator.vibrate(patterns.success);
  }
}

/**
 * Check if haptics are enabled
 */
export function isHapticsEnabled(): boolean {
  return settings.enabled;
}

/**
 * Enable or disable haptic feedback
 */
export function setHapticsEnabled(enabled: boolean): void {
  settings.enabled = enabled;
  saveSettings(settings);
}

/**
 * Toggle haptic feedback on/off
 */
export function toggleHaptics(): boolean {
  settings.enabled = !settings.enabled;
  saveSettings(settings);

  // Give immediate feedback when enabling
  if (settings.enabled) {
    haptic('light');
  }

  return settings.enabled;
}

/**
 * Check if the device supports haptic feedback
 */
export function supportsHaptics(): boolean {
  return isSupported();
}

export default {
  haptic,
  hapticWin,
  isHapticsEnabled,
  setHapticsEnabled,
  toggleHaptics,
  supportsHaptics
};
