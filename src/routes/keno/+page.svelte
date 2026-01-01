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
  import { Settings, Volume2, VolumeX, RefreshCw, ChevronDown } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;
  const TOTAL_NUMBERS = 40;
  const MAX_SELECTIONS = 10;
  const MIN_SELECTIONS = 1;
  const DRAW_COUNT = 10; // Numbers drawn each round

  // Payout tables based on difficulty and selections matched
  type PayoutTable = Record<number, Record<number, number[]>>;
  const payoutTables: PayoutTable = {
    // Easy difficulty - lower risk, lower rewards
    easy: {
      1: [0, 3.8],
      2: [0, 1.9, 4.5],
      3: [0, 1, 2.8, 12],
      4: [0, 0.5, 2, 5, 22],
      5: [0, 0.3, 1.5, 3, 9, 40],
      6: [0, 0.2, 1, 2, 5, 15, 65],
      7: [0, 0.1, 0.6, 1.5, 3, 8, 25, 100],
      8: [0, 0, 0.5, 1, 2, 5, 12, 40, 150],
      9: [0, 0, 0.3, 0.8, 1.5, 3, 8, 20, 80, 250],
      10: [0, 0, 0.2, 0.5, 1, 2.5, 6, 15, 50, 150, 400]
    },
    // Medium difficulty - balanced
    medium: {
      1: [0, 3.6],
      2: [0, 1.8, 5.2],
      3: [0, 0.8, 3, 15],
      4: [0, 0.3, 1.8, 7, 30],
      5: [0, 0.2, 1.2, 4, 12, 55],
      6: [0, 0.1, 0.8, 2.5, 7, 22, 100],
      7: [0, 0, 0.5, 1.5, 4, 12, 40, 175],
      8: [0, 0, 0.3, 1, 3, 7, 20, 75, 300],
      9: [0, 0, 0.2, 0.6, 2, 5, 15, 50, 150, 500],
      10: [0, 0, 0.1, 0.4, 1.5, 4, 10, 35, 100, 300, 1000]
    },
    // Hard difficulty - high risk, high rewards
    hard: {
      1: [0, 3.5],
      2: [0, 1.5, 6],
      3: [0, 0.5, 3.5, 20],
      4: [0, 0.2, 1.5, 10, 50],
      5: [0, 0.1, 1, 5, 18, 90],
      6: [0, 0, 0.6, 3, 10, 35, 180],
      7: [0, 0, 0.3, 2, 6, 20, 75, 350],
      8: [0, 0, 0.2, 1, 4, 12, 45, 150, 600],
      9: [0, 0, 0.1, 0.5, 2.5, 8, 30, 100, 350, 1000],
      10: [0, 0, 0, 0.3, 2, 5, 20, 70, 200, 600, 2000]
    }
  };

  // Game state
  let betAmount = $state(0);
  let difficulty = $state<'easy' | 'medium' | 'hard'>('medium');
  let muted = $state(false);
  let gameActive = $state(false);
  let selectedNumbers = $state<Set<number>>(new Set());
  let drawnNumbers = $state<Set<number>>(new Set());
  let matchedNumbers = $state<Set<number>>(new Set());
  let currentMultiplier = $state(0);
  let profit = $state(0);
  let revealIndex = $state(0);
  let isRevealing = $state(false);

  // Mode state
  let mode = $state<'manual' | 'auto'>('manual');

  // Settings panel
  let showSettings = $state(false);

  // Balance state
  let isLoggedIn = $derived($isPlayerLoggedIn);
  let balance = $derived($usdtBalance);

  // Selection count
  let selectionCount = $derived(selectedNumbers.size);
  let canPlay = $derived(selectionCount >= MIN_SELECTIONS && selectionCount <= MAX_SELECTIONS);

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
  let sounds: { select: HTMLAudioElement; draw: HTMLAudioElement; win: HTMLAudioElement; lose: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();

    if (browser) {
      sounds = {
        select: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
        draw: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"),
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

  function toggleNumber(num: number) {
    if (gameActive || isRevealing) return;

    const newSelected = new Set(selectedNumbers);
    if (newSelected.has(num)) {
      newSelected.delete(num);
    } else if (newSelected.size < MAX_SELECTIONS) {
      newSelected.add(num);
    }
    selectedNumbers = newSelected;
    playSound(sounds?.select);
    haptic('light');
  }

  function randomPick() {
    if (gameActive || isRevealing) return;

    // Clear current selection and pick random numbers
    const count = Math.max(MIN_SELECTIONS, Math.min(MAX_SELECTIONS, 5)); // Default pick 5
    const available = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const newSelected = new Set<number>();

    while (newSelected.size < count && available.length > 0) {
      const index = Math.floor(Math.random() * available.length);
      newSelected.add(available[index]);
      available.splice(index, 1);
    }

    selectedNumbers = newSelected;
    haptic('medium');
  }

  function clearTable() {
    if (gameActive || isRevealing) return;
    selectedNumbers = new Set();
    drawnNumbers = new Set();
    matchedNumbers = new Set();
    currentMultiplier = 0;
    profit = 0;
    haptic('light');
  }

  async function play() {
    if (!canPlay || !isLoggedIn || betAmount <= 0 || betAmount > balance || gameActive || isRevealing) return;

    const authState = playerAuth.get();
    if (!authState.token) return;

    gameActive = true;
    isRevealing = true;
    drawnNumbers = new Set();
    matchedNumbers = new Set();
    revealIndex = 0;

    // Generate drawn numbers
    const available = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const drawn: number[] = [];

    while (drawn.length < DRAW_COUNT) {
      const index = Math.floor(Math.random() * available.length);
      drawn.push(available[index]);
      available.splice(index, 1);
    }

    // Reveal numbers one by one
    for (let i = 0; i < drawn.length; i++) {
      await new Promise(r => setTimeout(r, 300));
      revealIndex = i + 1;
      drawnNumbers = new Set([...drawnNumbers, drawn[i]]);

      if (selectedNumbers.has(drawn[i])) {
        matchedNumbers = new Set([...matchedNumbers, drawn[i]]);
        playSound(sounds?.draw);
        haptic('light');
      }
    }

    // Calculate winnings
    const matches = matchedNumbers.size;
    const selections = selectedNumbers.size;
    const payouts = payoutTables[difficulty][selections];
    currentMultiplier = payouts[matches];
    profit = betAmount * currentMultiplier - betAmount;

    // Process bet with server
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'keno',
          bet: betAmount,
          selections: Array.from(selectedNumbers),
          difficulty: difficulty,
          drawn: drawn,
          matches: matches,
          multiplier: currentMultiplier
        }),
      });
      const result = await response.json();
      if (result.success) {
        playerAuth.updateBalance(result.balance);

        if (profit > 0) {
          playSound(sounds?.win);
          hapticWin(profit);

          // Show celebration for bigger wins
          if (profit >= 1) {
            celebrationAmount = profit;
            celebrationLevel = profit >= 50 ? 'mega' : profit >= 10 ? 'big' : 'normal';
            showWinCelebration = true;
          }
        } else {
          playSound(sounds?.lose);
        }
      }
    } catch (e) {
      // Handle error
    }

    gameActive = false;
    isRevealing = false;
  }

  function getNumberState(num: number): 'default' | 'selected' | 'drawn' | 'matched' {
    if (matchedNumbers.has(num)) return 'matched';
    if (drawnNumbers.has(num)) return 'drawn';
    if (selectedNumbers.has(num)) return 'selected';
    return 'default';
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
              disabled={gameActive || isRevealing}
            />
            <span class="btc-icon">₿</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet} disabled={gameActive || isRevealing}>½</button>
          <button class="bet-action-btn" onclick={doubleBet} disabled={gameActive || isRevealing}>2×</button>
        </div>
      </div>

      <!-- Difficulty Selection -->
      <div class="control-group">
        <div class="control-label">
          <span>Difficulty</span>
        </div>
        <div class="select-wrapper">
          <select class="difficulty-select" bind:value={difficulty} disabled={gameActive || isRevealing}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <ChevronDown size={16} class="select-icon" />
        </div>
      </div>

      <!-- Random Pick Button -->
      <button class="action-btn" onclick={randomPick} disabled={gameActive || isRevealing}>
        Random Pick
      </button>

      <!-- Clear Table Button -->
      <button class="action-btn secondary" onclick={clearTable} disabled={gameActive || isRevealing}>
        Clear Table
      </button>

      <!-- Bet Button -->
      <button
        class="bet-button"
        onclick={play}
        disabled={!canPlay || !isLoggedIn || betAmount <= 0 || betAmount > balance || gameActive || isRevealing}
      >
        {isRevealing ? 'Drawing...' : 'Bet'}
      </button>

      <!-- Results Display -->
      {#if drawnNumbers.size > 0}
        <div class="results-display">
          <div class="results-row">
            <span class="result-label">Matches</span>
            <span class="result-value">{matchedNumbers.size} / {selectionCount}</span>
          </div>
          <div class="results-row">
            <span class="result-label">Multiplier</span>
            <span class="result-value" class:win={currentMultiplier > 0}>{currentMultiplier.toFixed(2)}x</span>
          </div>
          <div class="results-row">
            <span class="result-label">Profit</span>
            <span class="result-value" class:win={profit > 0} class:loss={profit < 0}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(8)} ₿
            </span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Right Panel - Game Grid -->
    <div class="game-panel">
      <div class="keno-grid">
        {#each Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1) as num}
          {@const state = getNumberState(num)}
          <button
            class="keno-number"
            class:selected={state === 'selected'}
            class:drawn={state === 'drawn'}
            class:matched={state === 'matched'}
            onclick={() => toggleNumber(num)}
            disabled={gameActive || isRevealing}
          >
            {num}
          </button>
        {/each}
      </div>

      <!-- Selection Info -->
      <div class="selection-info">
        <span>Select {MIN_SELECTIONS} - {MAX_SELECTIONS} numbers to play</span>
        <span class="selection-count">{selectionCount} selected</span>
      </div>
    </div>
  </div>

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

  .bet-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

  .bet-action-btn:hover:not(:disabled) {
    background: #2a3f4f;
  }

  .bet-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select-wrapper {
    position: relative;
  }

  .difficulty-select {
    width: 100%;
    padding: 12px;
    padding-right: 40px;
    background: #0f212e;
    border: 2px solid transparent;
    border-radius: 8px;
    color: #fff;
    font-size: 1em;
    font-weight: 500;
    appearance: none;
    cursor: pointer;
  }

  .difficulty-select:focus {
    outline: none;
    border-color: #00e701;
  }

  .difficulty-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .select-wrapper :global(.select-icon) {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #7f8c8d;
    pointer-events: none;
  }

  .action-btn {
    width: 100%;
    padding: 12px;
    background: #2a3f4f;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover:not(:disabled) {
    background: #3a4f5f;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.secondary {
    background: #1a2c38;
    border: 1px solid #2a3f4f;
  }

  .action-btn.secondary:hover:not(:disabled) {
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

  .results-display {
    background: #0f212e;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .results-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .result-label {
    color: #7f8c8d;
    font-size: 0.9em;
  }

  .result-value {
    color: #fff;
    font-weight: 600;
  }

  .result-value.win {
    color: #00e701;
  }

  .result-value.loss {
    color: #ed4848;
  }

  /* Game Panel */
  .game-panel {
    flex: 1;
    background: #1a2c38;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .keno-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
    max-width: 600px;
    width: 100%;
  }

  .keno-number {
    aspect-ratio: 1;
    background: #2a3f4f;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 1.2em;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .keno-number:hover:not(:disabled):not(.selected):not(.drawn):not(.matched) {
    background: #3a5060;
    transform: scale(1.05);
  }

  .keno-number:disabled {
    cursor: not-allowed;
  }

  .keno-number.selected {
    background: #557086;
    color: #fff;
    transform: scale(0.95);
  }

  .keno-number.drawn {
    background: #ed4848;
    color: #fff;
  }

  .keno-number.matched {
    background: #00e701;
    color: #0f1923;
    animation: pulse-match 0.5s ease;
  }

  @keyframes pulse-match {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }

  .selection-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 600px;
    padding: 12px 16px;
    background: #0f212e;
    border-radius: 8px;
    color: #7f8c8d;
    font-size: 0.9em;
  }

  .selection-count {
    color: #fff;
    font-weight: 600;
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

    .keno-grid {
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;
    }

    .keno-number {
      font-size: 1em;
      border-radius: 6px;
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

    .keno-grid {
      gap: 4px;
    }

    .keno-number {
      font-size: 0.9em;
      border-radius: 4px;
    }
  }
</style>
