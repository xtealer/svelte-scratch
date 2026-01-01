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
  import { Settings, Volume2, VolumeX, RefreshCw, ChevronDown, Car } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;
  const LANES_COUNT = 9;

  // Lane multipliers based on difficulty
  const difficultyMultipliers: Record<string, number[]> = {
    easy: [1.08, 1.17, 1.27, 1.38, 1.50, 1.62, 1.76, 1.91, 2.07],
    medium: [1.15, 1.64, 2.00, 2.46, 3.06, 3.85, 4.90, 6.32, 8.26],
    hard: [1.31, 1.96, 2.94, 4.41, 6.62, 9.93, 14.89, 22.34, 33.51]
  };

  // Danger levels (chance of car hitting you) - higher = more dangerous
  const difficultyDanger: Record<string, number> = {
    easy: 0.15,    // 15% chance per lane
    medium: 0.30,  // 30% chance per lane
    hard: 0.45     // 45% chance per lane
  };

  interface Lane {
    id: number;
    multiplier: number;
    hasCar: boolean;
    carType: 'truck' | 'car' | 'none';
    carColor: string;
    revealed: boolean;
    safe: boolean;
  }

  // Game state
  let betAmount = $state(0);
  let difficulty = $state<'easy' | 'medium' | 'hard'>('medium');
  let muted = $state(false);
  let gameActive = $state(false);
  let gameOver = $state(false);
  let lanes = $state<Lane[]>([]);
  let currentLane = $state(-1); // -1 = starting position
  let currentMultiplier = $state(1.0);
  let profit = $state(0);
  let trafficLight = $state<'red' | 'yellow' | 'green'>('red');

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

  // Car colors
  const carColors = ['#9b59b6', '#3498db', '#e74c3c', '#f39c12', '#1abc9c', '#34495e'];

  // Sounds
  let sounds: { step: HTMLAudioElement; crash: HTMLAudioElement; win: HTMLAudioElement; horn: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();
    initializeLanes();

    if (browser) {
      sounds = {
        step: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
        crash: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
        win: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        horn: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"),
      };
    }
  });

  function initializeLanes() {
    const multipliers = difficultyMultipliers[difficulty];
    const dangerLevel = difficultyDanger[difficulty];

    lanes = multipliers.map((mult, i) => {
      const hasCar = Math.random() < dangerLevel;
      return {
        id: i,
        multiplier: mult,
        hasCar,
        carType: hasCar ? (Math.random() < 0.4 ? 'truck' : 'car') : 'none',
        carColor: carColors[Math.floor(Math.random() * carColors.length)],
        revealed: false,
        safe: !hasCar
      };
    });
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

  async function startGame() {
    if (gameActive || !isLoggedIn || betAmount <= 0 || betAmount > balance) return;

    const authState = playerAuth.get();
    if (!authState.token) return;

    initializeLanes();
    gameActive = true;
    gameOver = false;
    currentLane = -1;
    currentMultiplier = 1.0;
    profit = 0;
    trafficLight = 'green';

    // Deduct bet
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'chickenroad',
          bet: betAmount,
          action: 'start',
          difficulty: difficulty
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

  async function crossLane() {
    if (!gameActive || gameOver) return;

    const nextLane = currentLane + 1;
    if (nextLane >= LANES_COUNT) return;

    const lane = lanes[nextLane];

    // Animate traffic light
    trafficLight = 'yellow';
    await new Promise(r => setTimeout(r, 300));
    trafficLight = lane.safe ? 'green' : 'red';

    // Reveal the lane
    lanes = lanes.map((l, i) => i === nextLane ? { ...l, revealed: true } : l);
    currentLane = nextLane;

    if (lane.hasCar) {
      // Hit by car - game over
      playSound(sounds?.crash);
      haptic('heavy');
      gameOver = true;
      gameActive = false;

      // Reveal all lanes
      lanes = lanes.map(l => ({ ...l, revealed: true }));
    } else {
      // Safe crossing
      playSound(sounds?.step);
      haptic('light');
      currentMultiplier = lane.multiplier;
      profit = betAmount * currentMultiplier - betAmount;

      // Check if completed all lanes
      if (nextLane === LANES_COUNT - 1) {
        await cashout();
      }
    }
  }

  async function cashout() {
    if (!gameActive || currentLane < 0) return;

    const authState = playerAuth.get();
    if (!authState.token) return;

    gameActive = false;
    gameOver = true;
    playSound(sounds?.win);

    // Reveal all lanes
    lanes = lanes.map(l => ({ ...l, revealed: true }));

    // Process cashout with server
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'chickenroad',
          bet: betAmount,
          action: 'cashout',
          multiplier: currentMultiplier,
          lanesCleared: currentLane + 1
        }),
      });
      const result = await response.json();
      if (result.success) {
        playerAuth.updateBalance(result.balance);
        hapticWin(profit);

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

  function resetGame() {
    gameActive = false;
    gameOver = false;
    currentLane = -1;
    currentMultiplier = 1.0;
    profit = 0;
    trafficLight = 'red';
    initializeLanes();
  }

  // Update lanes when difficulty changes
  $effect(() => {
    if (!gameActive) {
      initializeLanes();
    }
  });
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

      <!-- Difficulty Selection -->
      <div class="control-group">
        <div class="control-label">
          <span>Difficulty</span>
        </div>
        <div class="select-wrapper">
          <select class="difficulty-select" bind:value={difficulty} disabled={gameActive}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <ChevronDown size={16} class="select-icon" />
        </div>
      </div>

      <!-- Bet/Go/Cashout Button -->
      {#if !gameActive}
        <button
          class="bet-button"
          onclick={startGame}
          disabled={!isLoggedIn || betAmount <= 0 || betAmount > balance}
        >
          Bet
        </button>
      {:else if !gameOver}
        <button class="bet-button go" onclick={crossLane}>
          Go
        </button>
      {:else}
        <button class="bet-button" onclick={resetGame}>
          Play Again
        </button>
      {/if}

      <!-- Cashout Button -->
      {#if gameActive && !gameOver && currentLane >= 0}
        <button class="cashout-button" onclick={cashout}>
          Cashout {currentMultiplier.toFixed(2)}x
        </button>
      {/if}

      <!-- Total Profit -->
      <div class="control-group">
        <div class="control-label">
          <span>Total profit ({currentMultiplier.toFixed(2)}x)</span>
          <span class="usd-value">${profit.toFixed(2)}</span>
        </div>
        <div class="profit-display">
          <span>{profit.toFixed(8)}</span>
          <span class="usdt-icon">$</span>
        </div>
      </div>
    </div>

    <!-- Right Panel - Game Area -->
    <div class="game-panel">
      <!-- Traffic Light -->
      <div class="traffic-light-container">
        <div class="traffic-light">
          <div class="light red" class:active={trafficLight === 'red'}></div>
          <div class="light yellow" class:active={trafficLight === 'yellow'}></div>
          <div class="light green" class:active={trafficLight === 'green'}></div>
        </div>
        <div class="traffic-pole"></div>
      </div>

      <!-- Road -->
      <div class="road-container">
        <!-- Sidewalk top -->
        <div class="sidewalk top">
          <div class="bush"></div>
        </div>

        <!-- Road lanes -->
        <div class="road">
          {#each lanes as lane, i}
            <div
              class="lane"
              class:current={i === currentLane}
              class:cleared={lane.revealed && lane.safe}
              class:crashed={lane.revealed && lane.hasCar}
              class:next={i === currentLane + 1 && gameActive && !gameOver}
            >
              <!-- Lane marking -->
              <div class="lane-marking"></div>

              <!-- Car or safe spot -->
              {#if lane.revealed}
                {#if lane.hasCar}
                  <div class="car-wrapper">
                    <div class="car" class:truck={lane.carType === 'truck'} style="--car-color: {lane.carColor}">
                      <div class="car-body"></div>
                      <div class="car-roof"></div>
                      <div class="car-window"></div>
                      <div class="car-wheels">
                        <div class="wheel"></div>
                        <div class="wheel"></div>
                      </div>
                    </div>
                  </div>
                {:else}
                  <div class="safe-marker"></div>
                {/if}
              {/if}

              <!-- Multiplier label -->
              <div class="lane-multiplier">
                {lane.multiplier.toFixed(2)}x
              </div>
            </div>
          {/each}
        </div>

        <!-- Sidewalk bottom / Starting area -->
        <div class="sidewalk bottom">
          <div class="chicken" class:walking={gameActive && !gameOver} style="--lane-offset: {currentLane}">
            🐔
          </div>
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

  .bet-button.go {
    background: #f7931a;
    color: #fff;
  }

  .bet-button.go:hover:not(:disabled) {
    background: #e88a00;
  }

  .cashout-button {
    width: 100%;
    padding: 12px;
    background: #2a3f4f;
    border: none;
    border-radius: 8px;
    color: #00e701;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cashout-button:hover {
    background: #3a4f5f;
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
    align-items: center;
    gap: 16px;
    overflow: hidden;
  }

  /* Traffic Light */
  .traffic-light-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .traffic-light {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #333;
    padding: 10px 8px;
    border-radius: 8px;
  }

  .light {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #555;
    transition: all 0.3s;
  }

  .light.red.active {
    background: #ed4848;
    box-shadow: 0 0 20px #ed4848;
  }

  .light.yellow.active {
    background: #f7931a;
    box-shadow: 0 0 20px #f7931a;
  }

  .light.green.active {
    background: #00e701;
    box-shadow: 0 0 20px #00e701;
  }

  .traffic-pole {
    width: 8px;
    height: 40px;
    background: #555;
  }

  /* Road */
  .road-container {
    width: 100%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
  }

  .sidewalk {
    height: 60px;
    background: #4a5568;
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 20px;
  }

  .sidewalk.top {
    border-radius: 8px 8px 0 0;
    justify-content: flex-start;
  }

  .sidewalk.bottom {
    border-radius: 0 0 8px 8px;
    justify-content: flex-start;
  }

  .bush {
    width: 50px;
    height: 30px;
    background: #2d5a3d;
    border-radius: 50% 50% 0 0;
  }

  .chicken {
    font-size: 2em;
    transition: transform 0.3s ease;
    transform: translateY(calc(var(--lane-offset, -1) * -55px - 20px));
  }

  .chicken.walking {
    animation: waddle 0.3s ease infinite;
  }

  @keyframes waddle {
    0%, 100% { transform: translateY(calc(var(--lane-offset, -1) * -55px - 20px)) rotate(-5deg); }
    50% { transform: translateY(calc(var(--lane-offset, -1) * -55px - 20px)) rotate(5deg); }
  }

  .road {
    display: flex;
    flex-direction: column-reverse;
    background: #2d3748;
  }

  .lane {
    height: 55px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    position: relative;
    border-bottom: 2px dashed rgba(255, 255, 255, 0.2);
    transition: all 0.3s;
  }

  .lane.next {
    background: rgba(247, 147, 26, 0.2);
  }

  .lane.cleared {
    background: rgba(0, 231, 1, 0.1);
  }

  .lane.crashed {
    background: rgba(237, 72, 72, 0.2);
  }

  .lane-marking {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 4px;
    background: #fff;
    opacity: 0.5;
  }

  .lane-multiplier {
    font-size: 0.9em;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px 12px;
    border-radius: 4px;
  }

  .car-wrapper {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .car {
    width: 60px;
    height: 35px;
    position: relative;
  }

  .car.truck {
    width: 80px;
    height: 40px;
  }

  .car-body {
    position: absolute;
    bottom: 5px;
    left: 0;
    width: 100%;
    height: 60%;
    background: var(--car-color, #3498db);
    border-radius: 4px;
  }

  .car.truck .car-body {
    height: 70%;
    border-radius: 4px 4px 4px 4px;
  }

  .car-roof {
    position: absolute;
    top: 0;
    left: 25%;
    width: 50%;
    height: 50%;
    background: var(--car-color, #3498db);
    border-radius: 4px 4px 0 0;
    filter: brightness(0.9);
  }

  .car.truck .car-roof {
    left: 10%;
    width: 30%;
    height: 60%;
  }

  .car-window {
    position: absolute;
    top: 5px;
    left: 30%;
    width: 40%;
    height: 35%;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 2px;
  }

  .car.truck .car-window {
    left: 15%;
    width: 20%;
  }

  .car-wheels {
    position: absolute;
    bottom: 0;
    left: 10%;
    width: 80%;
    display: flex;
    justify-content: space-between;
  }

  .wheel {
    width: 10px;
    height: 10px;
    background: #333;
    border-radius: 50%;
  }

  .safe-marker {
    width: 24px;
    height: 24px;
    background: #00e701;
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    animation: pulse-safe 1s ease infinite;
  }

  @keyframes pulse-safe {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
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

    .lane {
      height: 45px;
    }

    .chicken {
      font-size: 1.5em;
    }

    .car {
      width: 50px;
      height: 30px;
    }

    .car.truck {
      width: 65px;
      height: 35px;
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

    .lane {
      height: 40px;
    }

    .lane-multiplier {
      font-size: 0.8em;
      padding: 2px 8px;
    }
  }
</style>
