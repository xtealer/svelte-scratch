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
  import { Settings, Volume2, VolumeX, RefreshCw, Zap, Sparkles, Bomb, Info, Keyboard, ChevronDown } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;

  // Segment configurations by difficulty
  type SegmentConfig = { color: string; multiplier: number; count: number };

  const difficultyConfigs: Record<string, Record<number, SegmentConfig[]>> = {
    easy: {
      10: [
        { color: '#ffd700', multiplier: 1.5, count: 4 },  // Yellow
        { color: '#00e701', multiplier: 1.2, count: 3 },  // Green
        { color: '#557086', multiplier: 0, count: 3 },     // Grey (lose)
      ],
      20: [
        { color: '#ffd700', multiplier: 1.5, count: 6 },
        { color: '#00e701', multiplier: 1.2, count: 6 },
        { color: '#f7931a', multiplier: 2, count: 2 },     // Orange
        { color: '#557086', multiplier: 0, count: 6 },
      ],
      30: [
        { color: '#ffd700', multiplier: 1.5, count: 8 },
        { color: '#00e701', multiplier: 1.2, count: 8 },
        { color: '#f7931a', multiplier: 2, count: 4 },
        { color: '#557086', multiplier: 0, count: 10 },
      ],
      40: [
        { color: '#ffd700', multiplier: 1.5, count: 10 },
        { color: '#00e701', multiplier: 1.2, count: 10 },
        { color: '#f7931a', multiplier: 2, count: 6 },
        { color: '#557086', multiplier: 0, count: 14 },
      ],
      50: [
        { color: '#ffd700', multiplier: 1.5, count: 12 },
        { color: '#00e701', multiplier: 1.2, count: 12 },
        { color: '#f7931a', multiplier: 2, count: 8 },
        { color: '#8b5cf6', multiplier: 3, count: 2 },     // Purple
        { color: '#557086', multiplier: 0, count: 16 },
      ],
    },
    medium: {
      10: [
        { color: '#ffd700', multiplier: 2, count: 3 },
        { color: '#00e701', multiplier: 1.5, count: 2 },
        { color: '#557086', multiplier: 0, count: 5 },
      ],
      20: [
        { color: '#ffd700', multiplier: 2, count: 4 },
        { color: '#00e701', multiplier: 1.5, count: 4 },
        { color: '#f7931a', multiplier: 3, count: 2 },
        { color: '#557086', multiplier: 0, count: 10 },
      ],
      30: [
        { color: '#ffd700', multiplier: 2, count: 5 },
        { color: '#00e701', multiplier: 1.5, count: 6 },
        { color: '#f7931a', multiplier: 3, count: 3 },
        { color: '#8b5cf6', multiplier: 5, count: 1 },
        { color: '#557086', multiplier: 0, count: 15 },
      ],
      40: [
        { color: '#ffd700', multiplier: 2, count: 6 },
        { color: '#00e701', multiplier: 1.5, count: 8 },
        { color: '#f7931a', multiplier: 3, count: 4 },
        { color: '#8b5cf6', multiplier: 5, count: 2 },
        { color: '#557086', multiplier: 0, count: 20 },
      ],
      50: [
        { color: '#ffd700', multiplier: 2, count: 7 },
        { color: '#00e701', multiplier: 1.5, count: 10 },
        { color: '#f7931a', multiplier: 3, count: 5 },
        { color: '#8b5cf6', multiplier: 5, count: 3 },
        { color: '#fff', multiplier: 10, count: 1 },       // White (big win)
        { color: '#557086', multiplier: 0, count: 24 },
      ],
    },
    hard: {
      10: [
        { color: '#ffd700', multiplier: 3, count: 2 },
        { color: '#00e701', multiplier: 2, count: 1 },
        { color: '#557086', multiplier: 0, count: 7 },
      ],
      20: [
        { color: '#ffd700', multiplier: 3, count: 2 },
        { color: '#00e701', multiplier: 2, count: 3 },
        { color: '#f7931a', multiplier: 5, count: 1 },
        { color: '#557086', multiplier: 0, count: 14 },
      ],
      30: [
        { color: '#ffd700', multiplier: 3, count: 3 },
        { color: '#00e701', multiplier: 2, count: 4 },
        { color: '#f7931a', multiplier: 5, count: 2 },
        { color: '#8b5cf6', multiplier: 10, count: 1 },
        { color: '#557086', multiplier: 0, count: 20 },
      ],
      40: [
        { color: '#ffd700', multiplier: 3, count: 4 },
        { color: '#00e701', multiplier: 2, count: 5 },
        { color: '#f7931a', multiplier: 5, count: 3 },
        { color: '#8b5cf6', multiplier: 10, count: 1 },
        { color: '#fff', multiplier: 20, count: 1 },
        { color: '#557086', multiplier: 0, count: 26 },
      ],
      50: [
        { color: '#ffd700', multiplier: 3, count: 5 },
        { color: '#00e701', multiplier: 2, count: 6 },
        { color: '#f7931a', multiplier: 5, count: 4 },
        { color: '#8b5cf6', multiplier: 10, count: 2 },
        { color: '#fff', multiplier: 50, count: 1 },
        { color: '#557086', multiplier: 0, count: 32 },
      ],
    },
  };

  // Game state
  let difficulty = $state<'easy' | 'medium' | 'hard'>('medium');
  let segments = $state(30);
  let betAmount = $state(0);
  let muted = $state(false);
  let spinning = $state(false);
  let lastWinMultiplier = $state<number | null>(null);
  let lastWin = $state(false);
  let showResult = $state(false);
  let wheelRotation = $state(0);
  let targetRotation = $state(0);

  // Mode state
  let mode = $state<'manual' | 'auto'>('manual');

  // Dropdown states
  let showDifficultyDropdown = $state(false);
  let showSegmentsDropdown = $state(false);

  // Settings panel
  let showSettings = $state(false);
  let instantBet = $state(false);
  let animationsEnabled = $state(true);

  // Generate wheel segments
  let wheelSegments = $derived.by(() => {
    const config = difficultyConfigs[difficulty][segments];
    const result: Array<{ color: string; multiplier: number }> = [];

    for (const segment of config) {
      for (let i = 0; i < segment.count; i++) {
        result.push({ color: segment.color, multiplier: segment.multiplier });
      }
    }

    // Shuffle segments for visual variety
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  });

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
  let sounds: { spin: HTMLAudioElement; win: HTMLAudioElement; lose: HTMLAudioElement; tick: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();

    if (browser) {
      sounds = {
        spin: new Audio("https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"),
        win: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        lose: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
        tick: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
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
    showDifficultyDropdown = false;
    showSegmentsDropdown = false;
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
    showDifficultyDropdown = false;
    showSegmentsDropdown = false;
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

  // Dropdown controls
  function selectDifficulty(d: 'easy' | 'medium' | 'hard') {
    difficulty = d;
    showDifficultyDropdown = false;
    haptic('light');
  }

  function selectSegments(s: number) {
    segments = s;
    showSegmentsDropdown = false;
    haptic('light');
  }

  // Play the game
  async function play() {
    const currentBalance = $usdtBalance;
    if (spinning || currentBalance < betAmount || !$isPlayerLoggedIn || betAmount <= 0) {
      return;
    }

    const authState = playerAuth.get();
    if (!authState.token) {
      return;
    }

    spinning = true;
    showResult = false;
    lastWinMultiplier = null;
    playSound(sounds?.spin);

    // Call server API for the play result
    let result: { success: boolean; prize: number; balance: number; result?: number; segment?: number; error?: string };
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'wheel',
          bet: betAmount,
          difficulty: difficulty,
          segments: segments
        }),
      });
      result = await response.json();
    } catch {
      result = { success: false, prize: 0, balance: currentBalance, error: 'Network error' };
    }

    // Calculate target rotation based on winning segment
    const winningSegmentIndex = result.segment ?? Math.floor(Math.random() * wheelSegments.length);
    const segmentAngle = 360 / wheelSegments.length;

    // Spin at least 5 full rotations plus landing on the winning segment
    const fullRotations = 5 + Math.random() * 2;
    const segmentOffset = winningSegmentIndex * segmentAngle + segmentAngle / 2;
    targetRotation = wheelRotation + (fullRotations * 360) + (360 - segmentOffset);

    // Animate the wheel spin
    if (animationsEnabled) {
      const startRotation = wheelRotation;
      const animDuration = 4000;
      const startTime = Date.now();

      while (Date.now() - startTime < animDuration) {
        const progress = (Date.now() - startTime) / animDuration;
        // Ease out cubic for natural deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        wheelRotation = startRotation + (targetRotation - startRotation) * easeOut;
        await new Promise(r => setTimeout(r, 16));
      }
    }

    wheelRotation = targetRotation;

    if (result.success) {
      // Update balance in auth store
      playerAuth.updateBalance(result.balance);

      // Set the result
      lastWinMultiplier = wheelSegments[winningSegmentIndex]?.multiplier ?? 0;
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
      // On error, show loss
      lastWinMultiplier = 0;
      showResult = true;
      lastWin = false;
      playSound(sounds?.lose);
    }

    spinning = false;
  }

  // Draw wheel segment path
  function getSegmentPath(index: number, total: number): string {
    const angle = 360 / total;
    const startAngle = index * angle - 90;
    const endAngle = startAngle + angle;

    const outerRadius = 180;
    const innerRadius = 100;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = 200 + outerRadius * Math.cos(startRad);
    const y1 = 200 + outerRadius * Math.sin(startRad);
    const x2 = 200 + outerRadius * Math.cos(endRad);
    const y2 = 200 + outerRadius * Math.sin(endRad);
    const x3 = 200 + innerRadius * Math.cos(endRad);
    const y3 = 200 + innerRadius * Math.sin(endRad);
    const x4 = 200 + innerRadius * Math.cos(startRad);
    const y4 = 200 + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }
</script>

<svelte:window onclick={() => { showDifficultyDropdown = false; showSegmentsDropdown = false; }} />

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
            />
            <span class="usdt-icon">$</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet}>½</button>
          <button class="bet-action-btn" onclick={doubleBet}>2×</button>
        </div>
      </div>

      <!-- Difficulty -->
      <div class="control-group">
        <div class="control-label">
          <span>Difficulty</span>
        </div>
        <div class="dropdown-wrapper">
          <button
            class="dropdown-btn"
            onclick={(e) => { e.stopPropagation(); showDifficultyDropdown = !showDifficultyDropdown; showSegmentsDropdown = false; }}
          >
            <span class="capitalize">{difficulty}</span>
            <ChevronDown size={16} />
          </button>
          {#if showDifficultyDropdown}
            <div class="dropdown-menu" onclick={(e) => e.stopPropagation()}>
              <button class="dropdown-item" class:active={difficulty === 'easy'} onclick={() => selectDifficulty('easy')}>Easy</button>
              <button class="dropdown-item" class:active={difficulty === 'medium'} onclick={() => selectDifficulty('medium')}>Medium</button>
              <button class="dropdown-item" class:active={difficulty === 'hard'} onclick={() => selectDifficulty('hard')}>Hard</button>
            </div>
          {/if}
        </div>
      </div>

      <!-- Segments -->
      <div class="control-group">
        <div class="control-label">
          <span>Segments</span>
        </div>
        <div class="dropdown-wrapper">
          <button
            class="dropdown-btn"
            onclick={(e) => { e.stopPropagation(); showSegmentsDropdown = !showSegmentsDropdown; showDifficultyDropdown = false; }}
          >
            <span>{segments}</span>
            <ChevronDown size={16} />
          </button>
          {#if showSegmentsDropdown}
            <div class="dropdown-menu" onclick={(e) => e.stopPropagation()}>
              {#each [10, 20, 30, 40, 50] as s}
                <button class="dropdown-item" class:active={segments === s} onclick={() => selectSegments(s)}>{s}</button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Bet Button -->
      <button
        class="bet-button"
        onclick={play}
        disabled={spinning || !isLoggedIn || betAmount <= 0 || betAmount > balance}
      >
        {spinning ? 'Spinning...' : 'Bet'}
      </button>
    </div>

    <!-- Right Panel - Game Area -->
    <div class="game-panel">
      <!-- Wheel Container -->
      <div class="wheel-container">
        <!-- Pointer -->
        <div class="wheel-pointer">
          <svg width="30" height="40" viewBox="0 0 30 40">
            <path d="M15 40 L0 10 Q0 0 15 0 Q30 0 30 10 Z" fill="#ed4848" />
          </svg>
        </div>

        <!-- Wheel -->
        <svg
          class="wheel"
          viewBox="0 0 400 400"
          style="transform: rotate({wheelRotation}deg)"
        >
          <!-- Outer ring -->
          <circle cx="200" cy="200" r="195" fill="#2a3f4f" />

          <!-- Segments -->
          {#each wheelSegments as segment, i}
            <path
              d={getSegmentPath(i, wheelSegments.length)}
              fill={segment.color}
              stroke="#1a2c38"
              stroke-width="2"
            />
          {/each}

          <!-- Inner circle -->
          <circle cx="200" cy="200" r="95" fill="#0f1923" />
          <circle cx="200" cy="200" r="80" fill="#1a2c38" />
        </svg>

        <!-- Result Display -->
        {#if showResult && lastWinMultiplier !== null}
          <div class="result-overlay" class:win={lastWin}>
            <span class="result-multiplier">{lastWinMultiplier.toFixed(2)}×</span>
          </div>
        {/if}
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

  /* Dropdown */
  .dropdown-wrapper {
    position: relative;
  }

  .dropdown-btn {
    width: 100%;
    padding: 12px;
    background: #0f212e;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 1em;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.2s;
  }

  .dropdown-btn:hover {
    background: #2a3f4f;
  }

  .capitalize {
    text-transform: capitalize;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #0f212e;
    border-radius: 8px;
    margin-top: 4px;
    z-index: 50;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .dropdown-item {
    width: 100%;
    padding: 12px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 1em;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }

  .dropdown-item:hover {
    background: #2a3f4f;
  }

  .dropdown-item.active {
    background: #2a3f4f;
    color: #00e701;
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

  /* Game Panel */
  .game-panel {
    flex: 1;
    background: #1a2c38;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 32px;
  }

  .wheel-container {
    position: relative;
    width: 100%;
    max-width: 400px;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wheel-pointer {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .wheel {
    width: 100%;
    height: 100%;
    transition: transform 0.1s linear;
  }

  .result-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(15, 25, 35, 0.95);
    border-radius: 50%;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
  }

  .result-multiplier {
    font-size: 2em;
    font-weight: 700;
    color: #ed4848;
  }

  .result-overlay.win .result-multiplier {
    color: #00e701;
    text-shadow: 0 0 20px rgba(0, 231, 1, 0.5);
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

    .wheel-container {
      max-width: 300px;
    }

    .result-overlay {
      width: 100px;
      height: 100px;
    }

    .result-multiplier {
      font-size: 1.5em;
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

    .wheel-container {
      max-width: 250px;
    }

    .settings-panel {
      left: 8px;
      right: 8px;
      bottom: 56px;
    }
  }
</style>
