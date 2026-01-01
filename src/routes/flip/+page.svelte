<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import DepositModal from "$lib/DepositModal.svelte";
  import WithdrawModal from "$lib/WithdrawModal.svelte";
  import LoginModal from "$lib/LoginModal.svelte";
  import RegisterModal from "$lib/RegisterModal.svelte";
  import ProfileModal from "$lib/ProfileModal.svelte";
  import GameNavbar from "$lib/GameNavbar.svelte";
  import { initLanguage, direction, t } from "$lib/i18n";
  import { Settings, Volume2, VolumeX, RefreshCw, Zap, Sparkles, Bomb, Info, Keyboard, Shuffle } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;
  const MULTIPLIER = 1.98; // 2x with 1% house edge

  // Game state
  let selectedSide = $state<'heads' | 'tails'>('heads');
  let betAmount = $state(0);
  let muted = $state(false);
  let flipping = $state(false);
  let lastResult = $state<'heads' | 'tails' | null>(null);
  let lastWin = $state(false);
  let showResult = $state(false);
  let flipRotation = $state(0);
  let history = $state<Array<{ result: 'heads' | 'tails'; won: boolean }>>([]);

  // Mode state
  let mode = $state<'manual' | 'auto'>('manual');

  // Settings panel
  let showSettings = $state(false);
  let instantBet = $state(false);
  let animationsEnabled = $state(true);

  // Derived values
  let profitOnWin = $derived(betAmount * MULTIPLIER - betAmount);

  // Balance state - derived from user auth
  let isLoggedIn = $derived($isPlayerLoggedIn);
  let balance = $derived($usdtBalance);

  // Modals
  let showDepositModal = $state(false);
  let showWithdrawModal = $state(false);
  let showLoginModal = $state(false);
  let showRegisterModal = $state(false);
  let showProfileModal = $state(false);

  // Win celebration state
  let showWinCelebration = $state(false);
  let celebrationAmount = $state(0);
  let celebrationLevel = $state<'normal' | 'big' | 'mega'>('normal');

  // Sounds
  let sounds: { flip: HTMLAudioElement; win: HTMLAudioElement; lose: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();

    if (browser) {
      sounds = {
        flip: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
        win: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        lose: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
      };
    }
  });

  function playSound(sound: HTMLAudioElement | undefined) {
    if (sound && !muted) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  function toggleMute() {
    muted = !muted;
    haptic('light');
  }

  function closeAllModals() {
    showDepositModal = false;
    showWithdrawModal = false;
    showLoginModal = false;
    showRegisterModal = false;
    showProfileModal = false;
    showSettings = false;
  }

  function openDepositModal() {
    closeAllModals();
    showDepositModal = true;
  }

  function openWithdrawModal() {
    closeAllModals();
    showWithdrawModal = true;
  }

  function openLoginModal() {
    closeAllModals();
    showLoginModal = true;
  }

  function openRegisterModal() {
    closeAllModals();
    showRegisterModal = true;
  }

  function openProfileModal() {
    closeAllModals();
    showProfileModal = true;
  }

  function switchToRegister() {
    showLoginModal = false;
    showRegisterModal = true;
  }

  function switchToLogin() {
    showRegisterModal = false;
    showLoginModal = true;
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }

  // Bet amount controls
  function halveBet() {
    betAmount = Math.max(MIN_BET, betAmount / 2);
    haptic('light');
  }

  function doubleBet() {
    betAmount = Math.min(balance, MAX_BET, betAmount * 2);
    haptic('light');
  }

  function setMaxBet() {
    betAmount = Math.min(balance, MAX_BET);
    haptic('light');
  }

  // Side selection
  function selectSide(side: 'heads' | 'tails') {
    selectedSide = side;
    haptic('light');
  }

  function randomPick() {
    selectedSide = Math.random() < 0.5 ? 'heads' : 'tails';
    haptic('light');
  }

  // Play the game
  async function play() {
    const currentBalance = $usdtBalance;
    if (flipping || currentBalance < betAmount || !$isPlayerLoggedIn || betAmount <= 0) {
      return;
    }

    const authState = playerAuth.get();
    if (!authState.token) {
      return;
    }

    flipping = true;
    showResult = false;
    lastResult = null;
    playSound(sounds?.flip);

    // Animate the coin flip if animations enabled
    if (animationsEnabled) {
      const animDuration = 1500;
      const startTime = Date.now();
      const totalRotations = 5; // Number of full rotations

      while (Date.now() - startTime < animDuration) {
        const progress = (Date.now() - startTime) / animDuration;
        // Easing out the spin
        const easeOut = 1 - Math.pow(1 - progress, 3);
        flipRotation = easeOut * totalRotations * 360;
        await new Promise(r => setTimeout(r, 16));
      }
    }

    // Call server API for the play result
    let result: { success: boolean; prize: number; balance: number; result?: string; error?: string };
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'flip',
          bet: betAmount,
          selectedSide: selectedSide
        }),
      });
      result = await response.json();
    } catch {
      result = { success: false, prize: 0, balance: currentBalance, error: 'Network error' };
    }

    if (result.success) {
      // Update balance in auth store
      playerAuth.updateBalance(result.balance);

      // Set the result
      lastResult = (result.result as 'heads' | 'tails') ?? (Math.random() < 0.5 ? 'heads' : 'tails');

      // Set final rotation to show correct side
      flipRotation = lastResult === 'heads' ? 0 : 180;
      showResult = true;

      // Determine win/loss
      const won = result.prize > 0;
      lastWin = won;

      // Add to history
      history = [{ result: lastResult, won }, ...history.slice(0, 19)];

      if (won) {
        playSound(sounds?.win);
        hapticWin(result.prize);

        // Show win celebration for bigger wins
        if (result.prize >= 1) {
          celebrationAmount = result.prize;
          celebrationLevel = result.prize >= 50 ? 'mega' : result.prize >= 10 ? 'big' : 'normal';
          showWinCelebration = true;
        }
      } else {
        playSound(sounds?.lose);
      }
    } else {
      // On error, show random loss result
      lastResult = selectedSide === 'heads' ? 'tails' : 'heads';
      flipRotation = lastResult === 'heads' ? 0 : 180;
      showResult = true;
      lastWin = false;
      history = [{ result: lastResult, won: false }, ...history.slice(0, 19)];
      playSound(sounds?.lose);
    }

    flipping = false;
  }
</script>

<GameNavbar onDeposit={openDepositModal} onWithdraw={openWithdrawModal} onLogin={openLoginModal} onRegister={openRegisterModal} onProfile={openProfileModal} />

<div class="page" dir={$direction}>
  <div class="game-container">
    <!-- Left Panel - Controls -->
    <div class="controls-panel">
      <!-- Mode Toggle -->
      <div class="mode-toggle">
        <button class="mode-btn" class:active={mode === 'manual'} onclick={() => mode = 'manual'}>
          Manual
        </button>
        <button class="mode-btn" class:active={mode === 'auto'} onclick={() => mode = 'auto'}>
          Auto
        </button>
      </div>

      <!-- Bet Amount -->
      <div class="control-group">
        <div class="control-label">
          <span>Bet Amount</span>
          <span class="usd-value">${(betAmount * 90000).toFixed(2)}</span>
        </div>
        <div class="bet-input-row">
          <div class="bet-input-wrapper">
            <input
              type="number"
              class="bet-input"
              bind:value={betAmount}
              min={MIN_BET}
              max={Math.min(balance, MAX_BET)}
              step="0.00000001"
            />
            <span class="btc-icon">₿</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet}>½</button>
          <button class="bet-action-btn" onclick={doubleBet}>2×</button>
        </div>
      </div>

      <!-- Bet Button -->
      <button
        class="bet-button"
        onclick={play}
        disabled={flipping || !isLoggedIn || betAmount <= 0 || betAmount > balance}
      >
        {flipping ? 'Flipping...' : 'Bet'}
      </button>

      <!-- Random Pick -->
      <button class="random-btn" onclick={randomPick}>
        <Shuffle size={16} />
        Random Pick
      </button>

      <!-- Side Selection -->
      <div class="side-selection">
        <button
          class="side-btn heads"
          class:active={selectedSide === 'heads'}
          onclick={() => selectSide('heads')}
        >
          Heads <span class="coin-icon heads-icon">●</span>
        </button>
        <button
          class="side-btn tails"
          class:active={selectedSide === 'tails'}
          onclick={() => selectSide('tails')}
        >
          Tails <span class="coin-icon tails-icon">◆</span>
        </button>
      </div>

      <!-- Total Profit -->
      <div class="control-group">
        <div class="control-label">
          <span>Total Profit ({MULTIPLIER.toFixed(2)}×)</span>
          <span class="usd-value">${(profitOnWin * 90000).toFixed(2)}</span>
        </div>
        <div class="profit-display">
          <span>{profitOnWin.toFixed(8)}</span>
          <span class="btc-icon">₿</span>
        </div>
      </div>
    </div>

    <!-- Right Panel - Game Area -->
    <div class="game-panel">
      <!-- Coin Display -->
      <div class="coin-container">
        <div
          class="coin"
          class:flipping={flipping}
          class:heads={showResult && lastResult === 'heads'}
          class:tails={showResult && lastResult === 'tails'}
          style="transform: rotateY({flipRotation}deg)"
        >
          <div class="coin-face coin-heads">
            <div class="coin-inner"></div>
          </div>
          <div class="coin-face coin-tails">
            <div class="coin-inner diamond">◆</div>
          </div>
        </div>
        {#if showResult}
          <div class="result-label" class:win={lastWin}>
            {lastResult === 'heads' ? 'Heads' : 'Tails'}
            {#if lastWin}
              <span class="win-text">WIN!</span>
            {/if}
          </div>
        {/if}
      </div>

      <!-- History -->
      <div class="history-section">
        <div class="history-label">History</div>
        <div class="history-grid">
          {#each Array(20) as _, i}
            <div
              class="history-item"
              class:heads={history[i]?.result === 'heads'}
              class:tails={history[i]?.result === 'tails'}
              class:won={history[i]?.won}
              class:empty={!history[i]}
            >
              {#if history[i]}
                {history[i].result === 'heads' ? '●' : '◆'}
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Settings Panel -->
  {#if showSettings}
    <div class="settings-overlay" onclick={closeAllModals}></div>
    <div class="settings-panel">
      <div class="settings-row">
        <Volume2 size={16} />
        <input
          type="range"
          class="volume-slider"
          min="0"
          max="100"
          value={muted ? 0 : 100}
          onchange={(e) => muted = parseInt((e.target as HTMLInputElement).value) === 0}
        />
      </div>
      <button class="settings-option" onclick={() => instantBet = !instantBet}>
        <Zap size={16} />
        <span>Instant Bet</span>
        {#if instantBet}
          <span class="option-active">✓</span>
        {/if}
      </button>
      <button class="settings-option active" onclick={() => animationsEnabled = !animationsEnabled}>
        <Sparkles size={16} />
        <span>Animations</span>
        {#if animationsEnabled}
          <span class="option-active">✓</span>
        {/if}
      </button>
      <button class="settings-option" onclick={setMaxBet}>
        <Bomb size={16} />
        <span>Max Bet</span>
      </button>
      <button class="settings-option">
        <Info size={16} />
        <span>Game Info</span>
      </button>
      <button class="settings-option">
        <Keyboard size={16} />
        <span>Hotkeys</span>
      </button>
    </div>
  {/if}

  <!-- Footer -->
  <div class="game-footer">
    <div class="footer-left">
      <button class="footer-btn" onclick={toggleSettings}>
        <Settings size={18} />
      </button>
      <button class="footer-btn" onclick={toggleMute}>
        {#if muted}
          <VolumeX size={18} />
        {:else}
          <Volume2 size={18} />
        {/if}
      </button>
    </div>
    <div class="footer-center">
      <span class="stake-logo">Stake</span>
    </div>
    <div class="footer-right">
      <button class="fairness-btn">
        <RefreshCw size={14} />
        <span>Fairness</span>
      </button>
    </div>
  </div>
</div>

<DepositModal bind:show={showDepositModal} />
<WithdrawModal bind:show={showWithdrawModal} />
<LoginModal bind:show={showLoginModal} onSwitchToRegister={switchToRegister} />
<RegisterModal bind:show={showRegisterModal} onSwitchToLogin={switchToLogin} />
<ProfileModal bind:show={showProfileModal} />

<WinCelebration
  bind:show={showWinCelebration}
  amount={celebrationAmount}
  level={celebrationLevel}
  duration={2500}
/>

<style>
  .page {
    min-height: 100vh;
    min-height: 100dvh;
    background: #0f1923;
    display: flex;
    flex-direction: column;
    padding-top: 60px;
  }

  .game-container {
    flex: 1;
    display: flex;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 16px;
    gap: 16px;
  }

  /* Controls Panel */
  .controls-panel {
    width: 280px;
    min-width: 280px;
    background: #1a2c38;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mode-toggle {
    display: flex;
    background: #0f212e;
    border-radius: 24px;
    padding: 4px;
    gap: 4px;
  }

  .mode-btn {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 20px;
    background: transparent;
    color: #7f8c8d;
    font-weight: 600;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-btn.active {
    background: #2a3f4f;
    color: #fff;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.85em;
    color: #7f8c8d;
  }

  .usd-value {
    color: #7f8c8d;
  }

  .bet-input-row {
    display: flex;
    gap: 8px;
  }

  .bet-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  .bet-input {
    width: 100%;
    padding: 12px 40px 12px 12px;
    background: #0f212e;
    border: 2px solid transparent;
    border-radius: 8px;
    color: #fff;
    font-size: 1em;
    font-weight: 500;
  }

  .bet-input:focus {
    outline: none;
    border-color: #00e701;
  }

  .btc-icon {
    position: absolute;
    right: 12px;
    color: #f7931a;
    font-weight: bold;
  }

  .bet-action-btn {
    padding: 12px 16px;
    background: #0f212e;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .bet-action-btn:hover {
    background: #2a3f4f;
  }

  .bet-button {
    width: 100%;
    padding: 16px;
    background: #00e701;
    border: none;
    border-radius: 8px;
    color: #0f1923;
    font-size: 1.1em;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .bet-button:hover:not(:disabled) {
    background: #00c700;
    transform: scale(1.02);
  }

  .bet-button:disabled {
    background: #2a3f4f;
    color: #7f8c8d;
    cursor: not-allowed;
  }

  .random-btn {
    width: 100%;
    padding: 12px;
    background: #0f212e;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
  }

  .random-btn:hover {
    background: #2a3f4f;
  }

  .side-selection {
    display: flex;
    gap: 8px;
  }

  .side-btn {
    flex: 1;
    padding: 12px;
    border: 2px solid transparent;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .side-btn.heads {
    background: rgba(247, 147, 26, 0.1);
    color: #f7931a;
  }

  .side-btn.heads.active {
    background: rgba(247, 147, 26, 0.2);
    border-color: #f7931a;
  }

  .side-btn.tails {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .side-btn.tails.active {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
  }

  .coin-icon {
    font-size: 1.2em;
  }

  .heads-icon {
    color: #f7931a;
  }

  .tails-icon {
    color: #3b82f6;
  }

  .profit-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #0f212e;
    border-radius: 8px;
    color: #fff;
    font-weight: 500;
  }

  /* Game Panel */
  .game-panel {
    flex: 1;
    background: #1a2c38;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 32px;
  }

  .coin-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 250px;
    perspective: 1000px;
  }

  .coin {
    width: 200px;
    height: 200px;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.1s linear;
  }

  .coin.flipping {
    animation: none;
  }

  .coin-face {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .coin-heads {
    background: linear-gradient(135deg, #f7931a 0%, #ffb347 50%, #f7931a 100%);
    box-shadow:
      inset 0 0 30px rgba(0, 0, 0, 0.3),
      0 10px 30px rgba(247, 147, 26, 0.3);
  }

  .coin-tails {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
    box-shadow:
      inset 0 0 30px rgba(0, 0, 0, 0.3),
      0 10px 30px rgba(59, 130, 246, 0.3);
    transform: rotateY(180deg);
  }

  .coin-inner {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: #0f1923;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3em;
    color: #3b82f6;
  }

  .coin-inner.diamond {
    font-size: 4em;
  }

  .result-label {
    margin-top: 24px;
    font-size: 1.5em;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .result-label.win {
    color: #00e701;
  }

  .win-text {
    color: #00e701;
    animation: pulse 0.5s ease-in-out;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  /* History */
  .history-section {
    background: #0f212e;
    border-radius: 12px;
    padding: 16px;
  }

  .history-label {
    font-size: 0.85em;
    color: #7f8c8d;
    margin-bottom: 12px;
    font-weight: 500;
  }

  .history-grid {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .history-item {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: #1a2c38;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1em;
    transition: all 0.2s;
  }

  .history-item.empty {
    opacity: 0.3;
  }

  .history-item.heads {
    color: #f7931a;
    background: rgba(247, 147, 26, 0.1);
  }

  .history-item.tails {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  .history-item.won {
    box-shadow: 0 0 8px rgba(0, 231, 1, 0.3);
  }

  /* Settings Panel */
  .settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
  }

  .settings-panel {
    position: fixed;
    bottom: 60px;
    left: 16px;
    background: #fff;
    border-radius: 12px;
    padding: 12px;
    z-index: 101;
    min-width: 200px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .settings-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    color: #333;
  }

  .volume-slider {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    background: #e0e0e0;
    border-radius: 2px;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #00e701;
    border-radius: 50%;
    cursor: pointer;
  }

  .settings-option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 8px;
    background: transparent;
    border: none;
    color: #333;
    font-size: 0.9em;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .settings-option:hover {
    background: #f0f0f0;
  }

  .settings-option.active span:first-of-type {
    color: #00e701;
  }

  .option-active {
    margin-left: auto;
    color: #00e701;
  }

  /* Footer */
  .game-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0f212e;
    border-top: 1px solid #1a2c38;
  }

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .footer-btn {
    padding: 8px;
    background: transparent;
    border: none;
    color: #7f8c8d;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .footer-btn:hover {
    background: #1a2c38;
    color: #fff;
  }

  .footer-center {
    flex: 1;
    text-align: center;
  }

  .stake-logo {
    font-family: 'Georgia', serif;
    font-style: italic;
    font-size: 1.2em;
    color: #fff;
    font-weight: 600;
  }

  .fairness-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #1a2c38;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fairness-btn:hover {
    background: #2a3f4f;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .game-container {
      flex-direction: column-reverse;
      padding: 8px;
    }

    .controls-panel {
      width: 100%;
      min-width: unset;
    }

    .game-panel {
      padding: 16px;
    }

    .coin {
      width: 150px;
      height: 150px;
    }

    .coin-inner {
      width: 90px;
      height: 90px;
      font-size: 2.5em;
    }

    .coin-inner.diamond {
      font-size: 3em;
    }

    .coin-container {
      min-height: 200px;
    }

    .history-item {
      width: 28px;
      height: 28px;
      font-size: 0.9em;
    }
  }

  @media (max-width: 480px) {
    .page {
      padding-top: 52px;
    }

    .bet-input-row {
      flex-wrap: wrap;
    }

    .bet-input-wrapper {
      width: 100%;
    }

    .bet-action-btn {
      flex: 1;
    }

    .coin {
      width: 120px;
      height: 120px;
    }

    .coin-inner {
      width: 70px;
      height: 70px;
      font-size: 2em;
    }

    .coin-inner.diamond {
      font-size: 2.5em;
    }

    .settings-panel {
      left: 8px;
      right: 8px;
      bottom: 56px;
    }
  }
</style>
