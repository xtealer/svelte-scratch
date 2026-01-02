<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import DepositModal from "$lib/DepositModal.svelte";
  import WithdrawModal from "$lib/WithdrawModal.svelte";
  import LoginModal from "$lib/LoginModal.svelte";
  import RegisterModal from "$lib/RegisterModal.svelte";
  import ProfileModal from "$lib/ProfileModal.svelte";
  import Footer from "$lib/Footer.svelte";
  import GameNavbar from "$lib/GameNavbar.svelte";
  import { initLanguage, direction, t } from "$lib/i18n";
  import { Settings, Volume2, VolumeX, RefreshCw, Zap, Sparkles, Bomb, Info, Keyboard, ArrowLeftRight } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;
  const HOUSE_EDGE = 0.01; // 1% house edge

  // Game state
  let rollOver = $state(50.50);
  let isRollOver = $state(true); // true = Roll Over, false = Roll Under
  let betAmount = $state(0);
  let muted = $state(false);
  let rolling = $state(false);
  let lastResult = $state<number | null>(null);
  let lastWin = $state(false);
  let showResult = $state(false);

  // Settings panel
  let showSettings = $state(false);
  let instantBet = $state(false);
  let animationsEnabled = $state(true);

  // Derived values
  let winChance = $derived(isRollOver ? (99.99 - rollOver) : rollOver);
  let multiplier = $derived(winChance > 0 ? ((100 - HOUSE_EDGE * 100) / winChance) : 0);
  let profitOnWin = $derived(betAmount * multiplier - betAmount);

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

  // Slider dragging state
  let sliderContainer: HTMLDivElement;
  let isDragging = $state(false);

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

  // Multiplier/Roll Over/Win Chance controls
  function handleMultiplierChange(value: string) {
    const newMultiplier = parseFloat(value);
    if (!isNaN(newMultiplier) && newMultiplier >= 1.0102) {
      const newWinChance = (100 - HOUSE_EDGE * 100) / newMultiplier;
      if (isRollOver) {
        rollOver = Math.max(0.01, Math.min(99.98, 99.99 - newWinChance));
      } else {
        rollOver = Math.max(0.01, Math.min(99.98, newWinChance));
      }
    }
  }

  function handleRollOverChange(value: string) {
    const newRollOver = parseFloat(value);
    if (!isNaN(newRollOver)) {
      rollOver = Math.max(0.01, Math.min(99.98, newRollOver));
    }
  }

  function handleWinChanceChange(value: string) {
    const newWinChance = parseFloat(value);
    if (!isNaN(newWinChance) && newWinChance >= 0.01 && newWinChance <= 98) {
      if (isRollOver) {
        rollOver = 99.99 - newWinChance;
      } else {
        rollOver = newWinChance;
      }
    }
  }

  function toggleRollDirection() {
    isRollOver = !isRollOver;
    haptic('light');
  }

  // Slider interaction
  function handleSliderMouseDown(e: MouseEvent) {
    isDragging = true;
    updateSliderFromEvent(e);
  }

  function handleSliderMouseMove(e: MouseEvent) {
    if (isDragging) {
      updateSliderFromEvent(e);
    }
  }

  function handleSliderMouseUp() {
    isDragging = false;
  }

  function handleSliderTouchStart(e: TouchEvent) {
    isDragging = true;
    updateSliderFromTouch(e);
  }

  function handleSliderTouchMove(e: TouchEvent) {
    if (isDragging) {
      updateSliderFromTouch(e);
    }
  }

  function handleSliderTouchEnd() {
    isDragging = false;
  }

  function updateSliderFromEvent(e: MouseEvent) {
    if (!sliderContainer) return;
    const rect = sliderContainer.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percentage = (x / rect.width) * 100;
    rollOver = Math.max(0.01, Math.min(99.98, percentage));
  }

  function updateSliderFromTouch(e: TouchEvent) {
    if (!sliderContainer || !e.touches[0]) return;
    const rect = sliderContainer.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
    const percentage = (x / rect.width) * 100;
    rollOver = Math.max(0.01, Math.min(99.98, percentage));
  }

  // Roll the dice
  async function roll() {
    const currentBalance = $usdtBalance;
    if (rolling || currentBalance < betAmount || !$isPlayerLoggedIn || betAmount <= 0) {
      return;
    }

    const authState = playerAuth.get();
    if (!authState.token) {
      return;
    }

    rolling = true;
    showResult = false;
    lastResult = null;
    playSound(sounds?.roll);

    // Animate the result indicator if animations enabled
    if (animationsEnabled) {
      // Quick animation showing random numbers
      const animDuration = 1000;
      const startTime = Date.now();

      while (Date.now() - startTime < animDuration) {
        lastResult = Math.random() * 100;
        await new Promise(r => setTimeout(r, 50));
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
          gameId: 'dice',
          bet: betAmount,
          rollOver: rollOver,
          isRollOver: isRollOver
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
      lastResult = result.result ?? (Math.random() * 100);
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
      lastResult = isRollOver ? (Math.random() * rollOver) : (rollOver + Math.random() * (100 - rollOver));
      showResult = true;
      lastWin = false;
      playSound(sounds?.lose);
    }

    rolling = false;
  }
</script>

<svelte:window
  on:mouseup={handleSliderMouseUp}
  on:mousemove={handleSliderMouseMove}
  on:touchend={handleSliderTouchEnd}
/>

<GameNavbar onDeposit={openDepositModal} onWithdraw={openWithdrawModal} onLogin={openLoginModal} onRegister={openRegisterModal} onProfile={openProfileModal} />

<div class="page" dir={$direction}>
  <div class="game-container">
    <!-- Left Panel - Controls -->
    <div class="controls-panel">
      <!-- Bet Amount -->
      <div class="control-group">
        <div class="control-label">
          <span>Bet Amount</span>
          <span class="usd-value">${betAmount.toFixed(2)}</span>
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
            <span class="usdt-icon">$</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet}>½</button>
          <button class="bet-action-btn" onclick={doubleBet}>2×</button>
        </div>
      </div>

      <!-- Bet Button -->
      <button
        class="bet-button"
        onclick={roll}
        disabled={rolling || !isLoggedIn || betAmount <= 0 || betAmount > balance}
      >
        {rolling ? 'Rolling...' : 'Bet'}
      </button>

      <!-- Profit on Win -->
      <div class="control-group">
        <div class="control-label">
          <span>Profit on Win</span>
          <span class="usd-value">${profitOnWin.toFixed(2)}</span>
        </div>
        <div class="profit-display">
          <span>{profitOnWin.toFixed(8)}</span>
          <span class="usdt-icon">$</span>
        </div>
      </div>
    </div>

    <!-- Right Panel - Game Area -->
    <div class="game-panel">
      <!-- Result Display -->
      {#if showResult && lastResult !== null}
        <div class="result-display" class:win={lastWin} class:lose={!lastWin}>
          <span class="result-value">{lastResult.toFixed(2)}</span>
          <span class="result-label">{lastWin ? 'WIN!' : 'LOSE'}</span>
        </div>
      {/if}

      <!-- Slider -->
      <div class="slider-section">
        <div class="slider-labels">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>

        <div
          class="slider-container"
          bind:this={sliderContainer}
          onmousedown={handleSliderMouseDown}
          ontouchstart={handleSliderTouchStart}
          ontouchmove={handleSliderTouchMove}
          role="slider"
          aria-valuenow={rollOver}
          aria-valuemin={0}
          aria-valuemax={100}
          tabindex="0"
        >
          <div class="slider-track">
            {#if isRollOver}
              <div class="slider-lose" style="width: {rollOver}%"></div>
              <div class="slider-win" style="width: {100 - rollOver}%"></div>
            {:else}
              <div class="slider-win" style="width: {rollOver}%"></div>
              <div class="slider-lose" style="width: {100 - rollOver}%"></div>
            {/if}
          </div>
          <div class="slider-handle" style="left: {rollOver}%">
            <div class="handle-grip"></div>
          </div>
          {#if showResult && lastResult !== null}
            <div class="result-marker" class:win={lastWin} style="left: {lastResult}%"></div>
          {/if}
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-label">Multiplier</span>
          <div class="stat-input-row">
            <input
              type="text"
              class="stat-input"
              value={multiplier.toFixed(4)}
              onchange={(e) => handleMultiplierChange((e.target as HTMLInputElement).value)}
            />
            <span class="stat-icon">×</span>
          </div>
        </div>

        <div class="stat-box">
          <span class="stat-label">{isRollOver ? 'Roll Over' : 'Roll Under'}</span>
          <div class="stat-input-row">
            <input
              type="text"
              class="stat-input"
              value={rollOver.toFixed(2)}
              onchange={(e) => handleRollOverChange((e.target as HTMLInputElement).value)}
            />
            <button class="stat-icon-btn" onclick={toggleRollDirection}>
              <ArrowLeftRight size={14} />
            </button>
          </div>
        </div>

        <div class="stat-box">
          <span class="stat-label">Win Chance</span>
          <div class="stat-input-row">
            <input
              type="text"
              class="stat-input"
              value={winChance.toFixed(4)}
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

  .usdt-icon {
    position: absolute;
    right: 12px;
    color: #26a17b;
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

  .result-display {
    text-align: center;
    padding: 20px;
    border-radius: 12px;
    animation: fadeIn 0.3s ease;
  }

  .result-display.win {
    background: rgba(0, 231, 1, 0.1);
  }

  .result-display.lose {
    background: rgba(237, 72, 72, 0.1);
  }

  .result-value {
    display: block;
    font-size: 3em;
    font-weight: 700;
    color: #fff;
  }

  .result-display.win .result-value {
    color: #00e701;
  }

  .result-display.lose .result-value {
    color: #ed4848;
  }

  .result-label {
    display: block;
    font-size: 1.2em;
    font-weight: 600;
    margin-top: 8px;
  }

  .result-display.win .result-label {
    color: #00e701;
  }

  .result-display.lose .result-label {
    color: #ed4848;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  /* Slider */
  .slider-section {
    padding: 20px 0;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    color: #7f8c8d;
    font-size: 0.85em;
    font-weight: 500;
  }

  .slider-container {
    position: relative;
    height: 48px;
    cursor: pointer;
    user-select: none;
  }

  .slider-track {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 16px;
    transform: translateY(-50%);
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    background: #0f212e;
  }

  .slider-lose {
    background: linear-gradient(90deg, #ed4848, #ed4848);
    height: 100%;
  }

  .slider-win {
    background: linear-gradient(90deg, #00e701, #00e701);
    height: 100%;
  }

  .slider-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 48px;
    background: #557086;
    border-radius: 8px;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10;
  }

  .slider-handle:active {
    cursor: grabbing;
  }

  .handle-grip {
    width: 4px;
    height: 24px;
    background: repeating-linear-gradient(
      to bottom,
      #7f8c8d 0px,
      #7f8c8d 2px,
      transparent 2px,
      transparent 4px
    );
    border-radius: 2px;
  }

  .result-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 32px;
    background: #fff;
    border-radius: 2px;
    z-index: 5;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  .result-marker.win {
    background: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.5);
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
    color: #00e701;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-icon-btn:hover {
    background: #3a4f5f;
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

    .result-value {
      font-size: 2em;
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

    .slider-handle {
      width: 28px;
      height: 44px;
    }

    .settings-panel {
      left: 8px;
      right: 8px;
      bottom: 56px;
    }
  }
</style>
