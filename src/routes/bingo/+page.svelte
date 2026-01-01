<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import DepositModal from "$lib/DepositModal.svelte";
  import WithdrawModal from "$lib/WithdrawModal.svelte";
  import LoginModal from "$lib/LoginModal.svelte";
  import RegisterModal from "$lib/RegisterModal.svelte";
  import ProfileModal from "$lib/ProfileModal.svelte";
  import GameNavbar from "$lib/GameNavbar.svelte";
  import { initLanguage, direction, t } from "$lib/i18n";
  import { Settings, Volume2, VolumeX, RefreshCw, Play, RotateCcw } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;
  const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
  const DRAW_INTERVAL = 2000; // 2 seconds between draws

  // Payout multipliers based on winning pattern
  const PAYOUTS = {
    line: 2.5,      // Single line (horizontal, vertical, or diagonal)
    twoLines: 5,    // Two lines
    corners: 3,     // Four corners
    fullHouse: 10,  // All numbers (Blackout)
  };

  // Bingo card cell
  interface BingoCell {
    number: number;
    marked: boolean;
    isCenter: boolean;
  }

  // Game state
  let betAmount = $state(0);
  let muted = $state(false);
  let gameActive = $state(false);
  let gamePhase = $state<'betting' | 'playing' | 'finished'>('betting');
  let bingoCard = $state<BingoCell[][]>([]);
  let drawnNumbers = $state<number[]>([]);
  let currentBall = $state<number | null>(null);
  let ballPool = $state<number[]>([]);
  let winnings = $state(0);
  let winType = $state<string | null>(null);
  let drawInterval = $state<ReturnType<typeof setInterval> | null>(null);
  let isDrawing = $state(false);
  let autoPlay = $state(true);

  // Mode state
  let mode = $state<'manual' | 'auto'>('manual');

  // Settings panel
  let showSettings = $state(false);

  // Balance state
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

  // Ball animation state
  let ballAnimating = $state(false);

  // Sounds
  let sounds: { ball: HTMLAudioElement; mark: HTMLAudioElement; win: HTMLAudioElement; bingo: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();
    generateNewCard();

    if (browser) {
      sounds = {
        ball: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
        mark: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
        win: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        bingo: new Audio("https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3"),
      };
    }
  });

  onDestroy(() => {
    if (drawInterval) {
      clearInterval(drawInterval);
    }
  });

  function generateNewCard(): void {
    const card: BingoCell[][] = [];

    for (let col = 0; col < 5; col++) {
      const column: BingoCell[] = [];
      const min = col * 15 + 1;
      const max = col * 15 + 15;
      const usedNumbers = new Set<number>();

      for (let row = 0; row < 5; row++) {
        // Center is free space
        if (col === 2 && row === 2) {
          column.push({ number: 0, marked: true, isCenter: true });
        } else {
          let num: number;
          do {
            num = Math.floor(Math.random() * 15) + min;
          } while (usedNumbers.has(num));
          usedNumbers.add(num);
          column.push({ number: num, marked: false, isCenter: false });
        }
      }
      card.push(column);
    }

    bingoCard = card;
  }

  function initializeBallPool(): void {
    const pool: number[] = [];
    for (let i = 1; i <= 75; i++) {
      pool.push(i);
    }
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    ballPool = pool;
  }

  function getBallLetter(num: number): string {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  }

  function getBallColor(num: number): string {
    if (num <= 15) return '#3b82f6'; // Blue
    if (num <= 30) return '#ef4444'; // Red
    if (num <= 45) return '#f59e0b'; // Orange/Yellow
    if (num <= 60) return '#22c55e'; // Green
    return '#8b5cf6'; // Purple
  }

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

  function markNumber(col: number, row: number) {
    if (!gameActive || bingoCard[col][row].isCenter) return;

    const cellNumber = bingoCard[col][row].number;
    if (drawnNumbers.includes(cellNumber) && !bingoCard[col][row].marked) {
      bingoCard[col][row].marked = true;
      bingoCard = [...bingoCard];
      playSound(sounds?.mark);
      haptic('light');

      // Check for wins after marking
      checkForWin();
    }
  }

  function autoMarkNumbers() {
    let marked = false;
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        const cell = bingoCard[col][row];
        if (!cell.isCenter && !cell.marked && drawnNumbers.includes(cell.number)) {
          bingoCard[col][row].marked = true;
          marked = true;
        }
      }
    }
    if (marked) {
      bingoCard = [...bingoCard];
      playSound(sounds?.mark);
    }
  }

  function checkForWin(): string | null {
    // Check rows
    for (let row = 0; row < 5; row++) {
      if (bingoCard.every(col => col[row].marked)) {
        return 'line';
      }
    }

    // Check columns
    for (let col = 0; col < 5; col++) {
      if (bingoCard[col].every(cell => cell.marked)) {
        return 'line';
      }
    }

    // Check diagonals
    const diagonal1 = [0, 1, 2, 3, 4].every(i => bingoCard[i][i].marked);
    const diagonal2 = [0, 1, 2, 3, 4].every(i => bingoCard[i][4 - i].marked);
    if (diagonal1 || diagonal2) {
      return 'line';
    }

    // Check corners
    if (bingoCard[0][0].marked && bingoCard[4][0].marked &&
        bingoCard[0][4].marked && bingoCard[4][4].marked) {
      return 'corners';
    }

    // Check full house (all marked)
    const allMarked = bingoCard.every(col => col.every(cell => cell.marked));
    if (allMarked) {
      return 'fullHouse';
    }

    return null;
  }

  async function drawBall(): Promise<boolean> {
    if (ballPool.length === 0) return false;

    isDrawing = true;
    ballAnimating = true;

    const ball = ballPool.pop()!;
    currentBall = ball;
    drawnNumbers = [...drawnNumbers, ball];
    ballPool = [...ballPool];

    playSound(sounds?.ball);
    haptic('medium');

    // Wait for ball animation
    await new Promise(r => setTimeout(r, 800));
    ballAnimating = false;

    // Auto-mark if enabled
    if (autoPlay) {
      autoMarkNumbers();
    }

    // Check for win
    const win = checkForWin();
    if (win) {
      await handleWin(win);
      return true;
    }

    isDrawing = false;
    return false;
  }

  async function handleWin(type: string) {
    winType = type;
    gamePhase = 'finished';
    gameActive = false;

    if (drawInterval) {
      clearInterval(drawInterval);
      drawInterval = null;
    }

    const multiplier = PAYOUTS[type as keyof typeof PAYOUTS] || 1;
    winnings = betAmount * multiplier;

    playSound(sounds?.bingo);
    haptic('heavy');

    // Process win with server
    const authState = playerAuth.get();
    if (!authState.token) return;

    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'bingo',
          bet: betAmount,
          action: 'finish',
          multiplier: multiplier,
          winnings: winnings
        }),
      });
      const apiResult = await response.json();
      if (apiResult.success) {
        playerAuth.updateBalance(apiResult.balance);

        const profit = winnings - betAmount;
        hapticWin(profit);

        if (profit >= 1) {
          celebrationAmount = profit;
          celebrationLevel = profit >= 50 ? 'mega' : profit >= 10 ? 'big' : 'normal';
          showWinCelebration = true;
        }
      }
    } catch (e) {
      // Handle error
    }
  }

  async function startGame() {
    if (gameActive || !isLoggedIn || betAmount <= 0 || betAmount > balance) return;

    const authState = playerAuth.get();
    if (!authState.token) return;

    // Reset game state
    generateNewCard();
    initializeBallPool();
    drawnNumbers = [];
    currentBall = null;
    winnings = 0;
    winType = null;
    gameActive = true;
    gamePhase = 'playing';

    // Deduct bet
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'bingo',
          bet: betAmount,
          action: 'start'
        }),
      });
      const apiResult = await response.json();
      if (apiResult.success) {
        playerAuth.updateBalance(apiResult.balance);
      } else {
        gameActive = false;
        gamePhase = 'betting';
        return;
      }
    } catch (e) {
      gameActive = false;
      gamePhase = 'betting';
      return;
    }

    // Start drawing balls
    await drawBall();

    if (gameActive) {
      drawInterval = setInterval(async () => {
        const won = await drawBall();
        if (won || ballPool.length === 0) {
          if (drawInterval) {
            clearInterval(drawInterval);
            drawInterval = null;
          }
          if (!won) {
            // Ran out of balls without winning
            gamePhase = 'finished';
            gameActive = false;
          }
        }
      }, DRAW_INTERVAL);
    }
  }

  function newGame() {
    if (drawInterval) {
      clearInterval(drawInterval);
      drawInterval = null;
    }
    gamePhase = 'betting';
    gameActive = false;
    drawnNumbers = [];
    currentBall = null;
    winnings = 0;
    winType = null;
    generateNewCard();
  }

  function getWinMessage(): string {
    switch (winType) {
      case 'line': return 'BINGO! Line Complete!';
      case 'corners': return 'BINGO! Four Corners!';
      case 'fullHouse': return 'BLACKOUT! Full House!';
      default: return 'BINGO!';
    }
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
              disabled={gameActive}
            />
            <span class="usdt-icon">$</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet} disabled={gameActive}>½</button>
          <button class="bet-action-btn" onclick={doubleBet} disabled={gameActive}>2×</button>
        </div>
      </div>

      <!-- Payout Info -->
      <div class="control-group">
        <div class="control-label">
          <span>Payouts</span>
        </div>
        <div class="payout-list">
          <div class="payout-item">
            <span>Line (H/V/D)</span>
            <span class="payout-mult">{PAYOUTS.line}×</span>
          </div>
          <div class="payout-item">
            <span>Four Corners</span>
            <span class="payout-mult">{PAYOUTS.corners}×</span>
          </div>
          <div class="payout-item highlight">
            <span>Full House</span>
            <span class="payout-mult">{PAYOUTS.fullHouse}×</span>
          </div>
        </div>
      </div>

      <!-- Auto-daub toggle -->
      <div class="control-group">
        <label class="toggle-row">
          <span>Auto-Daub</span>
          <button
            class="toggle-btn"
            class:active={autoPlay}
            onclick={() => autoPlay = !autoPlay}
            disabled={gameActive}
          >
            {autoPlay ? 'ON' : 'OFF'}
          </button>
        </label>
      </div>

      <!-- Action Buttons -->
      {#if gamePhase === 'betting'}
        <button
          class="bet-button"
          onclick={startGame}
          disabled={!isLoggedIn || betAmount <= 0 || betAmount > balance}
        >
          <Play size={20} />
          Start Game
        </button>
      {:else if gamePhase === 'finished'}
        <button class="bet-button" onclick={newGame}>
          <RotateCcw size={20} />
          New Game
        </button>
      {:else}
        <button class="bet-button drawing" disabled>
          Drawing...
        </button>
      {/if}

      <!-- Game Result -->
      {#if winType && gamePhase === 'finished'}
        <div class="result-display win">
          <span class="result-text">{getWinMessage()}</span>
          <span class="result-amount">+${(winnings - betAmount).toFixed(2)}</span>
        </div>
      {:else if gamePhase === 'finished' && !winType}
        <div class="result-display lose">
          <span class="result-text">No Bingo</span>
          <span class="result-amount">-${betAmount.toFixed(2)}</span>
        </div>
      {/if}

      <!-- Drawn Numbers Count -->
      {#if gameActive || drawnNumbers.length > 0}
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-label">Balls Drawn</span>
            <span class="stat-value">{drawnNumbers.length}/75</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Right Panel - Game Area -->
    <div class="game-panel">
      <!-- Current Ball Display -->
      <div class="ball-display">
        {#if currentBall}
          <div
            class="current-ball"
            class:animating={ballAnimating}
            style="--ball-color: {getBallColor(currentBall)}"
          >
            <span class="ball-letter">{getBallLetter(currentBall)}</span>
            <span class="ball-number">{currentBall}</span>
          </div>
        {:else}
          <div class="current-ball empty">
            <span class="ball-letter">?</span>
            <span class="ball-number">--</span>
          </div>
        {/if}
      </div>

      <!-- Bingo Card -->
      <div class="bingo-card">
        <!-- Header -->
        <div class="bingo-header">
          {#each BINGO_LETTERS as letter, i}
            <div class="header-cell" style="--letter-color: {getBallColor(i * 15 + 1)}">
              {letter}
            </div>
          {/each}
        </div>

        <!-- Grid -->
        <div class="bingo-grid">
          {#each [0, 1, 2, 3, 4] as row}
            {#each [0, 1, 2, 3, 4] as col}
              {@const cell = bingoCard[col]?.[row]}
              {#if cell}
                <button
                  class="bingo-cell"
                  class:marked={cell.marked}
                  class:center={cell.isCenter}
                  class:available={!cell.marked && drawnNumbers.includes(cell.number)}
                  onclick={() => markNumber(col, row)}
                  disabled={!gameActive || cell.isCenter || cell.marked}
                >
                  {#if cell.isCenter}
                    <span class="free-space">FREE</span>
                  {:else}
                    <span class="cell-number">{cell.number}</span>
                  {/if}
                  {#if cell.marked && !cell.isCenter}
                    <div class="daub"></div>
                  {/if}
                </button>
              {/if}
            {/each}
          {/each}
        </div>
      </div>

      <!-- Recent Balls -->
      <div class="recent-balls">
        <div class="recent-label">Recent Balls:</div>
        <div class="balls-row">
          {#each drawnNumbers.slice(-10).reverse() as num, i}
            <div
              class="mini-ball"
              class:latest={i === 0}
              style="--ball-color: {getBallColor(num)}"
            >
              {num}
            </div>
          {/each}
          {#if drawnNumbers.length === 0}
            <span class="no-balls">No balls drawn yet</span>
          {/if}
        </div>
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

  .bet-action-btn:hover:not(:disabled) {
    background: #2a3f4f;
  }

  .bet-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .payout-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #0f212e;
    border-radius: 8px;
    padding: 12px;
  }

  .payout-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.85em;
    color: #b1bad3;
  }

  .payout-item.highlight {
    color: #ffd700;
  }

  .payout-mult {
    color: #00e701;
    font-weight: 600;
  }

  .payout-item.highlight .payout-mult {
    color: #ffd700;
  }

  .toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #7f8c8d;
    font-size: 0.85em;
  }

  .toggle-btn {
    padding: 6px 12px;
    background: #0f212e;
    border: none;
    border-radius: 6px;
    color: #7f8c8d;
    font-weight: 600;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background: #00e701;
    color: #0f1923;
  }

  .toggle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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

  .bet-button.drawing {
    background: #f7931a;
    color: #fff;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .result-display {
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .result-display.win {
    background: rgba(0, 231, 1, 0.2);
  }

  .result-display.lose {
    background: rgba(237, 72, 72, 0.2);
  }

  .result-text {
    display: block;
    font-size: 1.2em;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }

  .result-display.win .result-text {
    color: #00e701;
  }

  .result-display.lose .result-text {
    color: #ed4848;
  }

  .result-amount {
    display: block;
    font-size: 0.9em;
    color: #7f8c8d;
  }

  .result-display.win .result-amount {
    color: #00e701;
  }

  .stats-bar {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: #0f212e;
    border-radius: 8px;
  }

  .stat {
    flex: 1;
    text-align: center;
  }

  .stat-label {
    display: block;
    font-size: 0.75em;
    color: #7f8c8d;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 1.1em;
    font-weight: 600;
    color: #fff;
  }

  /* Game Panel */
  .game-panel {
    flex: 1;
    background: linear-gradient(135deg, #1a2c38 0%, #0f212e 100%);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    min-height: 500px;
  }

  /* Ball Display */
  .ball-display {
    display: flex;
    justify-content: center;
    padding: 16px;
  }

  .current-ball {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: var(--ball-color, #2a3f4f);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow:
      inset 0 -8px 20px rgba(0, 0, 0, 0.3),
      inset 0 8px 20px rgba(255, 255, 255, 0.2),
      0 8px 30px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease;
  }

  .current-ball.animating {
    animation: ballDrop 0.8s ease-out;
  }

  .current-ball.empty {
    background: #2a3f4f;
    opacity: 0.5;
  }

  @keyframes ballDrop {
    0% {
      transform: translateY(-100px) scale(0.5);
      opacity: 0;
    }
    50% {
      transform: translateY(20px) scale(1.1);
    }
    70% {
      transform: translateY(-10px) scale(0.95);
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  .ball-letter {
    font-size: 1.2em;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
  }

  .ball-number {
    font-size: 2em;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  /* Bingo Card */
  .bingo-card {
    background: #fff;
    border-radius: 12px;
    padding: 4px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .bingo-header {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    margin-bottom: 4px;
  }

  .header-cell {
    width: 56px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    font-weight: 800;
    color: var(--letter-color);
    background: #f8f9fa;
    border-radius: 6px;
  }

  .bingo-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }

  .bingo-cell {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border: 2px solid transparent;
    border-radius: 8px;
    font-size: 1.2em;
    font-weight: 600;
    color: #1a2c38;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .bingo-cell:hover:not(:disabled):not(.marked) {
    background: #e9ecef;
    transform: scale(1.05);
  }

  .bingo-cell.available {
    border-color: #00e701;
    animation: availablePulse 1s ease-in-out infinite;
  }

  @keyframes availablePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0, 231, 1, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(0, 231, 1, 0); }
  }

  .bingo-cell.center {
    background: linear-gradient(135deg, #ffd700, #f7931a);
    cursor: default;
  }

  .bingo-cell.marked {
    cursor: default;
  }

  .free-space {
    font-size: 0.7em;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .daub {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 44px;
    height: 44px;
    background: radial-gradient(circle, #ed4848 0%, #c53030 100%);
    border-radius: 50%;
    opacity: 0.9;
    animation: daubPop 0.3s ease-out;
  }

  @keyframes daubPop {
    0% { transform: translate(-50%, -50%) scale(0); }
    70% { transform: translate(-50%, -50%) scale(1.2); }
    100% { transform: translate(-50%, -50%) scale(1); }
  }

  .cell-number {
    position: relative;
    z-index: 1;
  }

  .bingo-cell.marked .cell-number {
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  /* Recent Balls */
  .recent-balls {
    width: 100%;
    max-width: 400px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .recent-label {
    font-size: 0.8em;
    color: #7f8c8d;
    margin-bottom: 8px;
  }

  .balls-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  .mini-ball {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--ball-color, #2a3f4f);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    font-weight: 600;
    color: #fff;
    box-shadow:
      inset 0 -3px 8px rgba(0, 0, 0, 0.3),
      inset 0 3px 8px rgba(255, 255, 255, 0.2);
  }

  .mini-ball.latest {
    transform: scale(1.2);
    box-shadow:
      inset 0 -3px 8px rgba(0, 0, 0, 0.3),
      inset 0 3px 8px rgba(255, 255, 255, 0.2),
      0 0 12px var(--ball-color);
  }

  .no-balls {
    color: #7f8c8d;
    font-size: 0.85em;
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
      min-height: auto;
    }

    .current-ball {
      width: 80px;
      height: 80px;
    }

    .ball-letter {
      font-size: 1em;
    }

    .ball-number {
      font-size: 1.6em;
    }

    .header-cell {
      width: 48px;
      height: 36px;
      font-size: 1.2em;
    }

    .bingo-cell {
      width: 48px;
      height: 48px;
      font-size: 1em;
    }

    .daub {
      width: 36px;
      height: 36px;
    }

    .mini-ball {
      width: 28px;
      height: 28px;
      font-size: 0.7em;
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

    .current-ball {
      width: 70px;
      height: 70px;
    }

    .ball-number {
      font-size: 1.4em;
    }

    .header-cell {
      width: 42px;
      height: 32px;
      font-size: 1em;
    }

    .bingo-cell {
      width: 42px;
      height: 42px;
      font-size: 0.9em;
    }

    .daub {
      width: 32px;
      height: 32px;
    }

    .free-space {
      font-size: 0.6em;
    }

    .mini-ball {
      width: 24px;
      height: 24px;
      font-size: 0.65em;
    }

    .balls-row {
      gap: 4px;
    }

    .payout-list {
      padding: 10px;
    }

    .payout-item {
      font-size: 0.8em;
    }
  }

  @media (max-width: 360px) {
    .header-cell {
      width: 38px;
      height: 28px;
      font-size: 0.9em;
    }

    .bingo-cell {
      width: 38px;
      height: 38px;
      font-size: 0.85em;
    }

    .daub {
      width: 28px;
      height: 28px;
    }

    .bingo-card {
      padding: 2px;
    }

    .bingo-header,
    .bingo-grid {
      gap: 2px;
    }
  }
</style>
