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
  import { Settings, Volume2, VolumeX, RefreshCw, Zap, Sparkles, Bomb, Info, Keyboard, X } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;
  const HOUSE_EDGE = 0.01; // 1% house edge
  const MIN_MULTIPLIER = 1.01;
  const MAX_MULTIPLIER = 1000000;

  // Game state
  let targetMultiplier = $state(2.00);
  let betAmount = $state(0);
  let muted = $state(false);
  let playing = $state(false);
  let lastResult = $state<number | null>(null);
  let lastWin = $state(false);
  let showResult = $state(false);
  let displayMultiplier = $state(1.00);

  // Mode state
  let mode = $state<'manual' | 'auto'>('manual');

  // Settings panel
  let showSettings = $state(false);
  let instantBet = $state(false);
  let animationsEnabled = $state(true);

  // Derived values
  let winChance = $derived(((100 - HOUSE_EDGE * 100) / targetMultiplier));
  let profitOnWin = $derived(betAmount * targetMultiplier - betAmount);

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
  let sounds: { roll: HTMLAudioElement; win: HTMLAudioElement; lose: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();

    if (browser) {
      sounds = {
        roll: new Audio("https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"),
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

  // Multiplier/Win Chance controls
  function handleMultiplierChange(value: string) {
    const newMultiplier = parseFloat(value);
    if (!isNaN(newMultiplier) && newMultiplier >= MIN_MULTIPLIER) {
      targetMultiplier = Math.min(MAX_MULTIPLIER, newMultiplier);
    }
  }

  function handleWinChanceChange(value: string) {
    const newWinChance = parseFloat(value);
    if (!isNaN(newWinChance) && newWinChance > 0 && newWinChance <= 98) {
      targetMultiplier = (100 - HOUSE_EDGE * 100) / newWinChance;
    }
  }

  function clearMultiplierInput() {
    targetMultiplier = 2.00;
    haptic('light');
  }

  // Play the game
  async function play() {
    const currentBalance = $usdtBalance;
    if (playing || currentBalance < betAmount || !$isPlayerLoggedIn || betAmount <= 0) {
      return;
    }

    const authState = playerAuth.get();
    if (!authState.token) {
      return;
    }

    playing = true;
    showResult = false;
    lastResult = null;
    displayMultiplier = 1.00;
    playSound(sounds?.roll);

    // Animate the multiplier counter if animations enabled
    if (animationsEnabled) {
      const animDuration = 1500;
      const startTime = Date.now();

      // Animate counting up
      while (Date.now() - startTime < animDuration) {
        const progress = (Date.now() - startTime) / animDuration;
        // Exponential easing for dramatic effect
        displayMultiplier = 1 + Math.pow(progress, 2) * (targetMultiplier * 1.5 - 1);
        await new Promise(r => setTimeout(r, 30));
      }
    }

    // Call server API for the play result
    let result: { success: boolean; prize: number; balance: number; result?: number; error?: string };
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'limbo',
          bet: betAmount,
          targetMultiplier: targetMultiplier
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
      lastResult = result.result ?? 1.00;
      displayMultiplier = lastResult;
      showResult = true;

      // Determine win/loss
      const won = result.prize > 0;
      lastWin = won;

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
      lastResult = Math.random() * (targetMultiplier - 1) + 1;
      displayMultiplier = lastResult;
      showResult = true;
      lastWin = false;
      playSound(sounds?.lose);
    }

    playing = false;
  }

  function getResultColor(multiplier: number): string {
    if (!showResult) return '#b1bad3';
    if (multiplier >= targetMultiplier) return '#00e701';
    return '#ed4848';
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
        disabled={playing || !isLoggedIn || betAmount <= 0 || betAmount > balance}
      >
        {playing ? 'Playing...' : 'Bet'}
      </button>

      <!-- Profit on Win -->
      <div class="control-group">
        <div class="control-label">
          <span>Profit on Win</span>
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
      <!-- Multiplier Display -->
      <div class="multiplier-display" class:win={showResult && lastWin} class:lose={showResult && !lastWin}>
        <span class="multiplier-value" style="color: {getResultColor(displayMultiplier)}">
          {displayMultiplier.toFixed(2)}×
        </span>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-label">Target Multiplier</span>
          <div class="stat-input-row">
            <input
              type="text"
              class="stat-input"
              value={targetMultiplier.toFixed(2)}
              onchange={(e) => handleMultiplierChange((e.target as HTMLInputElement).value)}
            />
            <button class="stat-icon-btn" onclick={clearMultiplierInput}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div class="stat-box">
          <span class="stat-label">Win Chance</span>
          <div class="stat-input-row">
            <input
              type="text"
              class="stat-input"
              value={winChance.toFixed(8)}
              onchange={(e) => handleWinChanceChange((e.target as HTMLInputElement).value)}
            />
            <span class="stat-icon">%</span>
          </div>
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

  .multiplier-display {
    text-align: center;
    padding: 40px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .multiplier-value {
    font-size: 6em;
    font-weight: 700;
    color: #b1bad3;
    transition: color 0.3s;
  }

  .multiplier-display.win .multiplier-value {
    color: #00e701;
    text-shadow: 0 0 30px rgba(0, 231, 1, 0.5);
  }

  .multiplier-display.lose .multiplier-value {
    color: #ed4848;
  }

  /* Stats Row */
  .stats-row {
    display: flex;
    gap: 12px;
  }

  .stat-box {
    flex: 1;
    background: #0f212e;
    border-radius: 8px;
    padding: 12px;
  }

  .stat-label {
    display: block;
    font-size: 0.75em;
    color: #7f8c8d;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .stat-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stat-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 1em;
    font-weight: 600;
    min-width: 0;
  }

  .stat-input:focus {
    outline: none;
  }

  .stat-icon {
    color: #7f8c8d;
    font-weight: 600;
  }

  .stat-icon-btn {
    background: #2a3f4f;
    border: none;
    border-radius: 4px;
    padding: 6px;
    color: #7f8c8d;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-icon-btn:hover {
    background: #3a4f5f;
    color: #fff;
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

    .multiplier-value {
      font-size: 4em;
    }

    .multiplier-display {
      min-height: 150px;
      padding: 20px;
    }

    .stats-row {
      flex-direction: column;
    }

    .stat-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-label {
      margin-bottom: 0;
    }

    .stat-input-row {
      flex: 1;
      justify-content: flex-end;
    }

    .stat-input {
      text-align: right;
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

    .multiplier-value {
      font-size: 3em;
    }

    .settings-panel {
      left: 8px;
      right: 8px;
      bottom: 56px;
    }
  }
</style>
