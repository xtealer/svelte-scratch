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
  import { Settings, Volume2, VolumeX, RefreshCw, Users, ChevronDown, ChevronUp } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;
  const TICK_INTERVAL = 100; // ms between multiplier updates
  const STARTING_MULTIPLIER = 1.0;

  // Game state
  type GamePhase = 'waiting' | 'running' | 'crashed';
  let gamePhase = $state<GamePhase>('waiting');
  let currentMultiplier = $state(STARTING_MULTIPLIER);
  let crashPoint = $state(0);
  let betAmount = $state(0);
  let cashoutAt = $state(2.0);
  let muted = $state(false);
  let hasBet = $state(false);
  let hasCashedOut = $state(false);
  let cashoutMultiplier = $state(0);
  let profit = $state(0);
  let countdown = $state(5);
  let elapsedTime = $state(0);

  // Settings panel
  let showSettings = $state(false);

  // History of recent crash points
  let crashHistory = $state<number[]>([12.60, 15.37, 1.28, 1.37, 1.17, 13.71, 4.46, 3.65, 1.00, 1.91, 1.75, 1.13]);
  let playersInRound = $state(267);
  let totalBetsAmount = $state(4796.61);

  // Balance state
  let isLoggedIn = $derived($isPlayerLoggedIn);
  let balance = $derived($usdtBalance);

  // Derived profit on win
  let profitOnWin = $derived(betAmount * cashoutAt - betAmount);

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

  // Canvas for graph
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  // Intervals
  let gameInterval: ReturnType<typeof setInterval> | null = null;
  let countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Sounds
  let sounds: { tick: HTMLAudioElement; crash: HTMLAudioElement; cashout: HTMLAudioElement; countdown: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();

    if (browser) {
      sounds = {
        tick: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
        crash: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
        cashout: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        countdown: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
      };

      if (canvas) {
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
      }

      // Start the game loop
      startWaitingPhase();
    }
  });

  onDestroy(() => {
    if (gameInterval) clearInterval(gameInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    if (browser) {
      window.removeEventListener('resize', resizeCanvas);
    }
  });

  function resizeCanvas() {
    if (canvas && canvas.parentElement) {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      drawGraph();
    }
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

  function adjustCashout(delta: number) {
    cashoutAt = Math.max(1.01, Math.min(100, cashoutAt + delta));
    haptic('light');
  }

  // Game phases
  function startWaitingPhase() {
    gamePhase = 'waiting';
    currentMultiplier = STARTING_MULTIPLIER;
    elapsedTime = 0;
    countdown = 5;
    hasCashedOut = false;
    cashoutMultiplier = 0;
    profit = 0;

    // Countdown
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        if (countdownInterval) clearInterval(countdownInterval);
        startRunningPhase();
      }
    }, 1000);
  }

  function startRunningPhase() {
    gamePhase = 'running';

    // Generate crash point using server-side logic (simulated here)
    // Using a provably fair-ish distribution
    const r = Math.random();
    crashPoint = Math.max(1, 0.99 / (1 - r));
    if (crashPoint > 100) crashPoint = 100;

    const startTime = Date.now();

    gameInterval = setInterval(() => {
      elapsedTime = (Date.now() - startTime) / 1000;

      // Multiplier grows exponentially
      currentMultiplier = Math.pow(Math.E, 0.06 * elapsedTime);

      // Check for auto-cashout
      if (hasBet && !hasCashedOut && currentMultiplier >= cashoutAt) {
        cashout();
      }

      // Check if crashed
      if (currentMultiplier >= crashPoint) {
        crash();
      } else {
        drawGraph();
      }
    }, TICK_INTERVAL);
  }

  function crash() {
    if (gameInterval) clearInterval(gameInterval);
    gamePhase = 'crashed';
    currentMultiplier = crashPoint;
    playSound(sounds?.crash);

    // Add to history
    crashHistory = [crashPoint, ...crashHistory.slice(0, 11)];

    // If player had a bet and didn't cash out, they lose
    if (hasBet && !hasCashedOut) {
      // Bet is lost - already deducted
    }

    hasBet = false;
    drawGraph();

    // Start next round after delay
    setTimeout(() => {
      startWaitingPhase();
    }, 3000);
  }

  async function placeBet() {
    if (gamePhase !== 'waiting' || hasBet) return;
    if (!isLoggedIn || betAmount <= 0 || betAmount > balance) return;

    const authState = playerAuth.get();
    if (!authState.token) return;

    // Deduct bet immediately (will be processed server-side on cashout)
    hasBet = true;
    playersInRound++;
    totalBetsAmount += betAmount;

    // Process bet with server
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'crash',
          bet: betAmount,
          action: 'bet'
        }),
      });
      const result = await response.json();
      if (result.success) {
        playerAuth.updateBalance(result.balance);
      }
    } catch (e) {
      // Handle error
    }

    haptic('medium');
  }

  async function cashout() {
    if (gamePhase !== 'running' || !hasBet || hasCashedOut) return;

    hasCashedOut = true;
    cashoutMultiplier = currentMultiplier;
    profit = betAmount * cashoutMultiplier - betAmount;

    const authState = playerAuth.get();
    if (!authState.token) return;

    playSound(sounds?.cashout);
    hapticWin(profit);

    // Process cashout with server
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'crash',
          bet: betAmount,
          action: 'cashout',
          multiplier: cashoutMultiplier
        }),
      });
      const result = await response.json();
      if (result.success) {
        playerAuth.updateBalance(result.balance);

        // Show celebration for bigger wins
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

  function drawGraph() {
    if (!ctx || !canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;

    // Clear canvas
    ctx.fillStyle = '#1a2c38';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Y-axis labels and lines (multipliers)
    const yLabels = [1.0, 1.2, 1.3, 1.5, 1.7, 1.8];
    const maxMultiplier = Math.max(1.8, currentMultiplier * 1.2);

    ctx.fillStyle = '#7f8c8d';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';

    for (const label of yLabels) {
      const y = height - padding - ((label - 1) / (maxMultiplier - 1)) * (height - padding * 2);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.fillText(`${label.toFixed(1)}x`, padding - 10, y + 4);
    }

    // X-axis labels and lines (time)
    const xLabels = ['2s', '4s', '6s', '8s'];
    ctx.textAlign = 'center';

    for (let i = 0; i < xLabels.length; i++) {
      const x = padding + ((i + 1) / 5) * (width - padding * 2);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      ctx.fillText(xLabels[i], x, height - padding + 20);
    }

    // Draw total time
    ctx.textAlign = 'right';
    ctx.fillText(`Total ${Math.floor(elapsedTime)}s`, width - padding, height - padding + 20);

    if (gamePhase === 'running' || gamePhase === 'crashed') {
      // Draw the curve with fill
      const points: [number, number][] = [];
      const maxTime = Math.max(8, elapsedTime);

      for (let t = 0; t <= elapsedTime; t += 0.05) {
        const mult = Math.pow(Math.E, 0.06 * t);
        const x = padding + (t / maxTime) * (width - padding * 2);
        const y = height - padding - ((mult - 1) / (maxMultiplier - 1)) * (height - padding * 2);
        points.push([x, y]);
      }

      if (points.length > 1) {
        // Fill area under curve
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        for (const [x, y] of points) {
          ctx.lineTo(x, y);
        }
        ctx.lineTo(points[points.length - 1][0], height - padding);
        ctx.closePath();
        ctx.fillStyle = gamePhase === 'crashed' ? 'rgba(237, 72, 72, 0.3)' : 'rgba(247, 147, 26, 0.5)';
        ctx.fill();

        // Draw curve line
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (const [x, y] of points) {
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = gamePhase === 'crashed' ? '#ed4848' : '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw endpoint circle
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPoint[0], lastPoint[1], 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    }
  }

  function getCrashColor(value: number): string {
    if (value >= 10) return '#00e701';
    if (value >= 2) return '#00e701';
    return '#7f8c8d';
  }
</script>

<GameNavbar onDeposit={openDepositModal} onWithdraw={openWithdrawModal} onLogin={openLoginModal} onRegister={openRegisterModal} onProfile={openProfileModal} />

<div class="page" dir={$direction}>
  <!-- Crash History Bar -->
  <div class="crash-history">
    {#each crashHistory as crash}
      <div class="crash-pill" style="background: {getCrashColor(crash) === '#00e701' ? 'rgba(0, 231, 1, 0.2)' : 'rgba(127, 140, 141, 0.2)'}; color: {getCrashColor(crash)}">
        {crash.toFixed(2)}x
      </div>
    {/each}
    <button class="history-btn">
      <Users size={16} />
    </button>
    <span class="you-label">&lt; You</span>
  </div>

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
              disabled={hasBet}
            />
            <span class="usdt-icon">$</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet} disabled={hasBet}>½</button>
          <button class="bet-action-btn" onclick={doubleBet} disabled={hasBet}>2×</button>
        </div>
      </div>

      <!-- Cashout At -->
      <div class="control-group">
        <div class="control-label">
          <span>Cashout At</span>
        </div>
        <div class="cashout-input-row">
          <input
            type="number"
            class="bet-input"
            bind:value={cashoutAt}
            min={1.01}
            max={100}
            step="0.01"
            disabled={hasBet}
          />
          <button class="cashout-btn" onclick={() => adjustCashout(-0.1)} disabled={hasBet}>
            <ChevronDown size={16} />
          </button>
          <button class="cashout-btn" onclick={() => adjustCashout(0.1)} disabled={hasBet}>
            <ChevronUp size={16} />
          </button>
        </div>
      </div>

      <!-- Bet/Cashout Button -->
      {#if gamePhase === 'waiting' && !hasBet}
        <button
          class="bet-button"
          onclick={placeBet}
          disabled={!isLoggedIn || betAmount <= 0 || betAmount > balance}
        >
          Bet
        </button>
      {:else if gamePhase === 'waiting' && hasBet}
        <button class="bet-button waiting" disabled>
          Bet (Next Round)
        </button>
      {:else if gamePhase === 'running' && hasBet && !hasCashedOut}
        <button class="bet-button cashout" onclick={cashout}>
          Cashout {currentMultiplier.toFixed(2)}x
        </button>
      {:else if hasCashedOut}
        <button class="bet-button cashed-out" disabled>
          Cashed Out @ {cashoutMultiplier.toFixed(2)}x
        </button>
      {:else}
        <button class="bet-button" disabled>
          Bet (Next Round)
        </button>
      {/if}

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

      <!-- Players Info -->
      <div class="players-info">
        <div class="players-row">
          <Users size={16} />
          <span>{playersInRound}</span>
        </div>
        <div class="total-bets">
          <span class="usdt-icon small">$</span>
          <span>${totalBetsAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Right Panel - Game Area -->
    <div class="game-panel">
      <div class="graph-container">
        <canvas bind:this={canvas}></canvas>

        <!-- Multiplier Display -->
        <div class="multiplier-overlay" class:crashed={gamePhase === 'crashed'}>
          <span class="multiplier-value">{currentMultiplier.toFixed(2)}x</span>
          {#if gamePhase === 'waiting'}
            <div class="status-bar">
              <div class="status-icon"></div>
              <span>Starting in {countdown}s</span>
            </div>
          {:else if gamePhase === 'crashed'}
            <div class="status-bar crashed">
              <span>Crashed!</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Network Status -->
      <div class="network-status">
        <span>Network Status</span>
        <span class="status-dot"></span>
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

  .crash-history {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #0f212e;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .crash-history::-webkit-scrollbar {
    display: none;
  }

  .crash-pill {
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.85em;
    font-weight: 600;
    white-space: nowrap;
  }

  .history-btn {
    padding: 8px;
    background: #1a2c38;
    border: none;
    border-radius: 50%;
    color: #7f8c8d;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .you-label {
    color: #7f8c8d;
    font-size: 0.8em;
    white-space: nowrap;
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

  .bet-input-row,
  .cashout-input-row {
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

  .cashout-input-row .bet-input {
    flex: 1;
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

  .usdt-icon.small {
    position: static;
    font-size: 0.9em;
  }

  .bet-action-btn,
  .cashout-btn {
    padding: 12px 16px;
    background: #0f212e;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bet-action-btn:hover:not(:disabled),
  .cashout-btn:hover:not(:disabled) {
    background: #2a3f4f;
  }

  .bet-action-btn:disabled,
  .cashout-btn:disabled {
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

  .bet-button.waiting {
    background: #2a3f4f;
    color: #fff;
  }

  .bet-button.cashout {
    background: #f7931a;
    color: #fff;
    animation: pulse 0.5s infinite;
  }

  .bet-button.cashed-out {
    background: #00e701;
    color: #0f1923;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
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

  .players-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #0f212e;
    border-radius: 8px;
    color: #7f8c8d;
    font-size: 0.9em;
  }

  .players-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .total-bets {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #fff;
  }

  /* Game Panel */
  .game-panel {
    flex: 1;
    background: #1a2c38;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .graph-container {
    flex: 1;
    position: relative;
    min-height: 300px;
  }

  .graph-container canvas {
    width: 100%;
    height: 100%;
  }

  .multiplier-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
  }

  .multiplier-value {
    font-size: 4em;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .multiplier-overlay.crashed .multiplier-value {
    color: #ed4848;
  }

  .status-bar {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    background: rgba(127, 140, 141, 0.3);
    border-radius: 8px;
    color: #fff;
    font-size: 1.1em;
    margin-top: 16px;
  }

  .status-bar.crashed {
    background: rgba(237, 72, 72, 0.3);
    color: #ed4848;
  }

  .status-icon {
    width: 20px;
    height: 20px;
    background: #f7931a;
    border-radius: 4px;
  }

  .network-status {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    color: #7f8c8d;
    font-size: 0.85em;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    background: #00e701;
    border-radius: 50%;
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

    .graph-container {
      min-height: 250px;
    }

    .multiplier-value {
      font-size: 2.5em;
    }

    .crash-history {
      padding: 8px 12px;
    }

    .crash-pill {
      padding: 4px 10px;
      font-size: 0.8em;
    }
  }

  @media (max-width: 480px) {
    .page {
      padding-top: 52px;
    }

    .bet-input-row,
    .cashout-input-row {
      flex-wrap: wrap;
    }

    .bet-input-wrapper {
      width: 100%;
    }

    .cashout-input-row .bet-input {
      flex: 1;
    }

    .bet-action-btn {
      flex: 1;
    }
  }
</style>
