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
  import { Settings, Volume2, VolumeX, RefreshCw, Gem, Bomb, ChevronDown } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;
  const GRID_SIZE = 5;
  const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

  // Tile state types
  type TileState = 'hidden' | 'revealed' | 'mine' | 'gem';

  interface Tile {
    id: number;
    state: TileState;
    isMine: boolean;
  }

  // Game state
  let betAmount = $state(0);
  let minesCount = $state(3);
  let muted = $state(false);
  let gameActive = $state(false);
  let gameOver = $state(false);
  let tiles = $state<Tile[]>([]);
  let revealedCount = $state(0);
  let currentMultiplier = $state(1.0);
  let profit = $state(0);

  // Settings panel
  let showSettings = $state(false);

  // Balance state
  let isLoggedIn = $derived($isPlayerLoggedIn);
  let balance = $derived($usdtBalance);

  // Gems count (safe tiles)
  let gemsCount = $derived(TOTAL_TILES - minesCount);

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

  // Mine options
  const mineOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 22, 24];

  // Sounds
  let sounds: { click: HTMLAudioElement; mine: HTMLAudioElement; gem: HTMLAudioElement; cashout: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();
    initializeGrid();

    if (browser) {
      sounds = {
        click: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
        mine: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
        gem: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"),
        cashout: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
      };
    }
  });

  function initializeGrid() {
    tiles = Array.from({ length: TOTAL_TILES }, (_, i) => ({
      id: i,
      state: 'hidden',
      isMine: false
    }));
    revealedCount = 0;
    currentMultiplier = 1.0;
    profit = 0;
  }

  function calculateMultiplier(revealed: number, mines: number): number {
    // House edge calculation for mines
    const safeSquares = TOTAL_TILES - mines;
    let multiplier = 1;
    for (let i = 0; i < revealed; i++) {
      multiplier *= (safeSquares - i) / (TOTAL_TILES - mines - i);
    }
    // Invert to get payout multiplier with house edge
    const baseMultiplier = 1 / multiplier;
    return baseMultiplier * 0.99; // 1% house edge
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

    // Start the game
    initializeGrid();

    // Place mines randomly
    const minePositions = new Set<number>();
    while (minePositions.size < minesCount) {
      minePositions.add(Math.floor(Math.random() * TOTAL_TILES));
    }

    tiles = tiles.map((tile, i) => ({
      ...tile,
      isMine: minePositions.has(i)
    }));

    gameActive = true;
    gameOver = false;

    // Deduct bet
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'mines',
          bet: betAmount,
          action: 'start',
          mines: minesCount
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

  async function revealTile(index: number) {
    if (!gameActive || gameOver || tiles[index].state !== 'hidden') return;

    playSound(sounds?.click);

    const tile = tiles[index];

    if (tile.isMine) {
      // Hit a mine - game over
      tiles[index] = { ...tile, state: 'mine' };

      // Reveal all mines
      tiles = tiles.map(t => ({
        ...t,
        state: t.isMine ? 'mine' : t.state
      }));

      gameOver = true;
      gameActive = false;
      playSound(sounds?.mine);
      haptic('heavy');
    } else {
      // Safe tile - gem found
      tiles[index] = { ...tile, state: 'gem' };
      revealedCount++;
      currentMultiplier = calculateMultiplier(revealedCount, minesCount);
      profit = betAmount * currentMultiplier - betAmount;
      playSound(sounds?.gem);
      haptic('light');

      // Check if all safe tiles revealed
      if (revealedCount >= gemsCount) {
        await cashout();
      }
    }
  }

  async function cashout() {
    if (!gameActive || revealedCount === 0) return;

    const authState = playerAuth.get();
    if (!authState.token) return;

    gameActive = false;
    gameOver = true;
    playSound(sounds?.cashout);

    // Process cashout with server
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'mines',
          bet: betAmount,
          action: 'cashout',
          multiplier: currentMultiplier,
          revealed: revealedCount
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

    // Reveal all remaining tiles
    tiles = tiles.map(t => ({
      ...t,
      state: t.state === 'hidden' ? (t.isMine ? 'mine' : 'gem') : t.state
    }));
  }

  function randomPick() {
    if (!gameActive || gameOver) return;

    // Find all hidden tiles
    const hiddenIndices = tiles
      .map((t, i) => t.state === 'hidden' ? i : -1)
      .filter(i => i !== -1);

    if (hiddenIndices.length === 0) return;

    // Pick a random hidden tile
    const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    revealTile(randomIndex);
  }

  function resetGame() {
    gameActive = false;
    gameOver = false;
    initializeGrid();
  }
</script>

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
              disabled={gameActive}
            />
            <span class="usdt-icon">$</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet} disabled={gameActive}>½</button>
          <button class="bet-action-btn" onclick={doubleBet} disabled={gameActive}>2×</button>
        </div>
      </div>

      <!-- Mines Selection -->
      <div class="control-group">
        <div class="control-label">
          <span>Mines</span>
        </div>
        <div class="select-wrapper">
          <select class="mine-select" bind:value={minesCount} disabled={gameActive}>
            {#each mineOptions as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
          <ChevronDown size={16} class="select-icon" />
        </div>
      </div>

      <!-- Gems Display -->
      <div class="control-group">
        <div class="control-label">
          <span>Gems</span>
        </div>
        <div class="gems-display">
          <span>{gemsCount}</span>
        </div>
      </div>

      <!-- Bet/Cashout Button -->
      {#if !gameActive}
        <button
          class="bet-button"
          onclick={startGame}
          disabled={!isLoggedIn || betAmount <= 0 || betAmount > balance}
        >
          Bet
        </button>
      {:else}
        <button
          class="bet-button cashout"
          onclick={cashout}
          disabled={revealedCount === 0}
        >
          Cashout {currentMultiplier.toFixed(2)}x
        </button>
      {/if}

      <!-- Random Pick Button -->
      {#if gameActive && !gameOver}
        <button class="random-btn" onclick={randomPick}>
          Random Pick
        </button>
      {/if}

      <!-- Total Profit -->
      <div class="control-group">
        <div class="control-label">
          <span>Total Profit ({currentMultiplier.toFixed(2)}x)</span>
          <span class="usd-value">${profit.toFixed(2)}</span>
        </div>
        <div class="profit-display">
          <span>{profit.toFixed(8)}</span>
          <span class="usdt-icon">$</span>
        </div>
      </div>
    </div>

    <!-- Right Panel - Game Grid -->
    <div class="game-panel">
      <div class="mines-grid">
        {#each tiles as tile, index}
          <button
            class="tile"
            class:hidden={tile.state === 'hidden'}
            class:gem={tile.state === 'gem'}
            class:mine={tile.state === 'mine'}
            class:revealed={tile.state !== 'hidden'}
            onclick={() => revealTile(index)}
            disabled={!gameActive || tile.state !== 'hidden'}
          >
            {#if tile.state === 'gem'}
              <Gem size={32} class="gem-icon" />
            {:else if tile.state === 'mine'}
              <Bomb size={32} class="mine-icon" />
            {/if}
          </button>
        {/each}
      </div>

      {#if gameOver && !tiles.some(t => t.state === 'mine' && tiles.find((t2, i) => tiles[i].state === 'mine' && tiles.findIndex(t3 => t3.state === 'mine') === i))}
        <div class="game-result" class:win={profit > 0}>
          {#if profit > 0}
            <span class="result-text">You won ${profit.toFixed(2)} USDT!</span>
          {:else}
            <span class="result-text">Better luck next time!</span>
          {/if}
        </div>
      {/if}
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

  .mine-select {
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

  .mine-select:focus {
    outline: none;
    border-color: #00e701;
  }

  .mine-select:disabled {
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

  .gems-display {
    padding: 12px;
    background: #0f212e;
    border-radius: 8px;
    color: #fff;
    font-weight: 500;
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

  .bet-button.cashout {
    background: #f7931a;
    color: #fff;
  }

  .bet-button.cashout:hover:not(:disabled) {
    background: #e88a00;
  }

  .random-btn {
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

  .random-btn:hover {
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
    justify-content: center;
    gap: 24px;
  }

  .mines-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    max-width: 500px;
    width: 100%;
  }

  .tile {
    aspect-ratio: 1;
    background: #2a3f4f;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .tile.hidden:hover:not(:disabled) {
    background: #3a5060;
    transform: scale(1.05);
  }

  .tile:disabled {
    cursor: not-allowed;
  }

  .tile.gem {
    background: linear-gradient(135deg, #00e701, #007b00);
  }

  .tile.mine {
    background: linear-gradient(135deg, #ed4848, #b33030);
  }

  .tile :global(.gem-icon) {
    color: #fff;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .tile :global(.mine-icon) {
    color: #fff;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .game-result {
    padding: 16px 32px;
    background: rgba(237, 72, 72, 0.2);
    border-radius: 8px;
    text-align: center;
  }

  .game-result.win {
    background: rgba(0, 231, 1, 0.2);
  }

  .result-text {
    font-size: 1.1em;
    font-weight: 600;
    color: #fff;
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

    .mines-grid {
      max-width: 100%;
    }

    .tile {
      border-radius: 6px;
    }

    .tile :global(.gem-icon),
    .tile :global(.mine-icon) {
      width: 24px;
      height: 24px;
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

    .mines-grid {
      gap: 6px;
    }

    .tile :global(.gem-icon),
    .tile :global(.mine-icon) {
      width: 20px;
      height: 20px;
    }
  }
</style>
