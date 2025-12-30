<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import PrizeModal from "$lib/PrizeModal.svelte";
  import ScratchCodeModal from "$lib/ScratchCodeModal.svelte";
  import ClaimModal from "$lib/ClaimModal.svelte";
  import SlotSymbol from "$lib/SlotSymbols.svelte";
  import Footer from "$lib/Footer.svelte";
  import { initLanguage, direction } from "$lib/i18n";
  import { ArrowLeft, Trophy, X, Volume2, VolumeX, RotateCw, Grid3x3, Play } from "lucide-svelte";

  const MAX_PRIZE = 500;
  const MIN_BET = 1;
  const MAX_BET = 10;
  const BET_STEPS = [1, 2, 5, 10];

  // Classic slot symbols
  const allSymbols = ["cherry", "plum", "lemon", "bell", "seven", "bar", "diamond", "star"];

  // Symbol to prize mapping
  const symbolPrizes: Record<string, number> = {
    diamond: 500,
    seven: 100,
    bar: 50,
    bell: 20,
    star: 10,
    cherry: 5,
    plum: 2,
    lemon: 1,
  };

  // Prize odds (~50% RTP, ~18% win rate)
  const prizes = [
    { amount: 500, odds: 8945, symbol: "diamond" },
    { amount: 100, odds: 3334, symbol: "seven" },
    { amount: 50, odds: 1243, symbol: "bar" },
    { amount: 20, odds: 463, symbol: "bell" },
    { amount: 10, odds: 173, symbol: "star" },
    { amount: 5, odds: 64, symbol: "cherry" },
    { amount: 2, odds: 24, symbol: "plum" },
    { amount: 1, odds: 9, symbol: "lemon" },
    { amount: 0, odds: 0 },
  ];

  // Calculate probabilities
  let totalProb = 0;
  prizes.forEach((p) => {
    if (p.amount > 0) totalProb += 1 / p.odds;
  });

  // Game state
  let currentPrize = $state(0);
  let lastWin = $state(0);
  let displayedWin = $state(0); // For animated counter
  // 3x3 grid: reels[col][row]
  let reels = $state<string[][]>([
    ["bar", "bar", "cherry"],
    ["bar", "bar", "bar"],
    ["bar", "bar", "bar"]
  ]);
  let muted = $state(false);
  let spinning = $state(false);
  let betSize = $state(1);

  // Animation state
  let isWinAnimating = $state(false);
  let winAnimationFrame: number | null = null;

  // Animate win counter from 0 to target
  function animateWinCounter(targetWin: number) {
    // Cancel any existing animation
    if (winAnimationFrame) {
      cancelAnimationFrame(winAnimationFrame);
    }

    displayedWin = 0;
    isWinAnimating = true;

    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      displayedWin = Math.round(targetWin * easeOut);

      if (progress < 1) {
        winAnimationFrame = requestAnimationFrame(animate);
      } else {
        displayedWin = targetWin;
        isWinAnimating = false;
        winAnimationFrame = null;
      }
    }

    winAnimationFrame = requestAnimationFrame(animate);
  }

  // Session state
  let hasActiveSession = $state(false);
  let currentCode = $state("");
  let credits = $state(0);
  let sessionWinnings = $state(0);

  // Autoplay state
  let autoplayActive = $state(false);
  let autoplaySpinsLeft = $state(0);
  const AUTOPLAY_OPTIONS = [10, 25, 50, 100];

  // Modals
  let showPrizeModal = $state(false);
  let showCodeModal = $state(false);
  let showClaimModal = $state(false);

  // LocalStorage key
  const STORAGE_KEY = "goldSlots_session";

  // Sounds
  let sounds: { spin: HTMLAudioElement; win: HTMLAudioElement; bigWin: HTMLAudioElement; lose: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();

    if (browser) {
      sounds = {
        spin: new Audio("https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"),
        win: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        bigWin: new Audio("https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3"),
        lose: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
      };

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const session = JSON.parse(saved);
          if (session.credits > 0 || session.sessionWinnings > 0) {
            currentCode = session.code || "";
            credits = session.credits || 0;
            sessionWinnings = session.sessionWinnings || 0;
            hasActiveSession = true;
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  });

  function saveSession() {
    if (browser && hasActiveSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        code: currentCode,
        credits,
        sessionWinnings
      }));
    }
  }

  function clearSession() {
    if (browser) {
      localStorage.removeItem(STORAGE_KEY);
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
  }

  function openPrizeList() {
    showPrizeModal = true;
  }

  function openCodeModal() {
    showCodeModal = true;
  }

  function openClaimModal() {
    showClaimModal = true;
  }

  function convertWinningsToCredits() {
    if (sessionWinnings > 0) {
      credits += sessionWinnings;
      sessionWinnings = 0;
      // Adjust bet size if needed
      if (betSize > credits) {
        for (let i = BET_STEPS.length - 1; i >= 0; i--) {
          if (BET_STEPS[i] <= credits) {
            betSize = BET_STEPS[i];
            break;
          }
        }
      }
      saveSession();
    }
  }

  function increaseBet() {
    const currentIndex = BET_STEPS.indexOf(betSize);
    if (currentIndex < BET_STEPS.length - 1) {
      const nextBet = BET_STEPS[currentIndex + 1];
      if (nextBet <= credits) {
        betSize = nextBet;
      }
    }
  }

  function decreaseBet() {
    const currentIndex = BET_STEPS.indexOf(betSize);
    if (currentIndex > 0) {
      betSize = BET_STEPS[currentIndex - 1];
    }
  }

  function getRandomSymbol(): string {
    return allSymbols[Math.floor(Math.random() * allSymbols.length)];
  }

  function getRandomReelStrip(): string[] {
    return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
  }

  function getPrize(): { amount: number; symbol: string } {
    const rand = Math.random();
    let cum = 0;
    for (const p of prizes) {
      if (p.amount > 0) {
        cum += 1 / p.odds;
        if (rand <= cum) return { amount: p.amount, symbol: p.symbol! };
      }
    }
    return { amount: 0, symbol: "" };
  }

  function getWinReels(symbol: string): string[][] {
    // Middle row (index 1) all match
    return [
      [getRandomSymbol(), symbol, getRandomSymbol()],
      [getRandomSymbol(), symbol, getRandomSymbol()],
      [getRandomSymbol(), symbol, getRandomSymbol()]
    ];
  }

  function getLoseReels(): string[][] {
    let r: string[][];
    do {
      r = [getRandomReelStrip(), getRandomReelStrip(), getRandomReelStrip()];
    } while (r[0][1] === r[1][1] && r[1][1] === r[2][1]);
    return r;
  }

  function getNearMissReels(): string[][] {
    const symbol = allSymbols[Math.floor(Math.random() * 3)];
    const otherSymbol = allSymbols.find(s => s !== symbol) || "lemon";
    return [
      [getRandomSymbol(), symbol, getRandomSymbol()],
      [getRandomSymbol(), symbol, getRandomSymbol()],
      [getRandomSymbol(), otherSymbol, getRandomSymbol()]
    ];
  }

  async function handleCodeSubmit(code: string): Promise<void> {
    const response = await fetch("/api/scratch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, gameId: 'slots' }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Código inválido");
    }

    currentCode = data.code;
    credits = data.plays;
    sessionWinnings = data.totalWinnings || 0;
    hasActiveSession = true;
    betSize = Math.min(betSize, credits);
    if (betSize < 1) betSize = 1;
    lastWin = 0;
    reels = [getRandomReelStrip(), getRandomReelStrip(), getRandomReelStrip()];
    saveSession();
  }

  function resetSession() {
    stopAutoplay();
    clearSession();
    hasActiveSession = false;
    currentCode = "";
    credits = 0;
    sessionWinnings = 0;
    currentPrize = 0;
    lastWin = 0;
    reels = [getRandomReelStrip(), getRandomReelStrip(), getRandomReelStrip()];
    betSize = 1;
  }

  function startAutoplay(spins: number) {
    autoplaySpinsLeft = spins;
    autoplayActive = true;
    spin();
  }

  function stopAutoplay() {
    autoplayActive = false;
    autoplaySpinsLeft = 0;
  }

  function toggleAutoplay() {
    if (autoplayActive) {
      stopAutoplay();
    } else {
      startAutoplay(50);
    }
  }

  async function spin() {
    if (spinning || credits < betSize || !hasActiveSession) {
      if (autoplayActive) stopAutoplay();
      return;
    }

    spinning = true;
    currentPrize = 0;
    lastWin = 0;
    displayedWin = 0;
    playSound(sounds?.spin);

    const spinDuration = 2000;
    const spinInterval = 60;

    const spinAnimation = setInterval(() => {
      reels = [getRandomReelStrip(), getRandomReelStrip(), getRandomReelStrip()];
    }, spinInterval);

    // Call server API for the play result
    let result: { success: boolean; prize: number; symbol: string; playsLeft: number; totalWinnings: number; error?: string };
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode, gameId: 'slots', bet: betSize }),
      });
      result = await response.json();
    } catch {
      result = { success: false, prize: 0, symbol: '', playsLeft: credits, totalWinnings: sessionWinnings, error: 'Network error' };
    }

    // Wait for spin animation to complete
    await new Promise((resolve) => setTimeout(resolve, spinDuration));
    clearInterval(spinAnimation);

    if (result.success) {
      credits = result.playsLeft;
      sessionWinnings = result.totalWinnings;

      if (result.prize > 0) {
        currentPrize = result.prize;
        lastWin = currentPrize;
        reels = getWinReels(result.symbol);

        // Animate the win counter
        animateWinCounter(currentPrize);

        if (currentPrize >= 50) {
          playSound(sounds?.bigWin);
        } else {
          playSound(sounds?.win);
        }
      } else {
        if (Math.random() < 0.3) {
          reels = getNearMissReels();
        } else {
          reels = getLoseReels();
        }
        playSound(sounds?.lose);
      }
    } else {
      // On error, show loss animation
      reels = getLoseReels();
      playSound(sounds?.lose);
    }

    spinning = false;

    if (credits < betSize && credits > 0) {
      for (let i = BET_STEPS.length - 1; i >= 0; i--) {
        if (BET_STEPS[i] <= credits) {
          betSize = BET_STEPS[i];
          break;
        }
      }
    }

    saveSession();

    if (autoplayActive) {
      autoplaySpinsLeft--;
      if (autoplaySpinsLeft <= 0 || credits < betSize) {
        stopAutoplay();
      } else {
        setTimeout(() => spin(), 500);
      }
    }
  }
</script>

<div class="container" dir={$direction}>
  <!-- Top controls -->
  <div class="top-controls">
    <a href="/" class="control-btn back-btn" title="Volver al Menú">
      <ArrowLeft size={20} />
    </a>
    <div class="spacer"></div>
    {#if hasActiveSession}
      <button class="control-btn end-btn" onclick={resetSession} title="Terminar Sesión">
        <X size={20} />
      </button>
    {/if}
    <button class="control-btn" class:muted={muted} onclick={toggleMute} title={muted ? "Activar Sonido" : "Silenciar"}>
      {#if muted}
        <VolumeX size={20} />
      {:else}
        <Volume2 size={20} />
      {/if}
    </button>
  </div>

  <!-- Win display -->
  <div class="win-display" class:winner={lastWin > 0} class:counting={isWinAnimating}>
    WIN: ${displayedWin}
  </div>

  <!-- Slot machine reels -->
  <div class="slot-machine">
    <div class="reels-container">
      {#each reels as reel, colIdx}
        <div class="reel-column">
          {#each reel as symbol, rowIdx}
            <div class="symbol-cell" class:center-row={rowIdx === 1} class:spinning>
              <SlotSymbol {symbol} size={65} />
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <!-- Bottom controls -->
  {#if hasActiveSession}
    <div class="bottom-controls">
      <div class="left-info">
        <div class="info-row">
          <span class="info-label">Credit:</span>
          <span class="info-value">${credits}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Bet:</span>
          <span class="info-value">${betSize}</span>
        </div>
        {#if sessionWinnings > 0}
          <div class="info-row winnings">
            <span class="info-label">Ganado:</span>
            <span class="info-value winnings-value">${sessionWinnings}</span>
          </div>
        {/if}
      </div>

      <div class="center-controls">
        <button class="bet-adjust-btn" onclick={decreaseBet} disabled={spinning || betSize <= MIN_BET}>
          −
        </button>

        {#if credits >= betSize}
          <button
            class="spin-btn"
            onclick={spin}
            disabled={spinning}
            class:spinning
          >
            <RotateCw size={24} />
            <span>SPIN</span>
          </button>
        {:else if sessionWinnings > 0}
          <button class="spin-btn claim" onclick={openClaimModal}>
            <span>Cobrar ${sessionWinnings}</span>
          </button>
        {:else}
          <button class="spin-btn new-code" onclick={openCodeModal}>
            <span>CÓDIGO</span>
          </button>
        {/if}

        <button class="bet-adjust-btn" onclick={increaseBet} disabled={spinning || betSize >= MAX_BET || BET_STEPS[BET_STEPS.indexOf(betSize) + 1] > credits}>
          +
        </button>
      </div>

      <div class="right-controls">
        <button class="side-btn" onclick={openPrizeList}>
          <Grid3x3 size={16} />
          <span>Pay Table</span>
        </button>
        <button class="side-btn" onclick={toggleAutoplay} class:active={autoplayActive}>
          <Play size={16} />
          <span>AUTO | {autoplayActive ? 'ON' : 'OFF'}</span>
        </button>
        {#if sessionWinnings > 0}
          <button class="claim-btn" onclick={openClaimModal}>
            Cobrar ${sessionWinnings}
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <div class="enter-code-container">
      <button class="enter-code-btn" onclick={openCodeModal}>
        Ingresar Código
      </button>
    </div>
  {/if}

  <Footer />
</div>

<PrizeModal bind:show={showPrizeModal} />
<ScratchCodeModal bind:show={showCodeModal} onCodeSubmit={handleCodeSubmit} />
<ClaimModal
  bind:show={showClaimModal}
  scratchCode={currentCode}
  totalWinnings={sessionWinnings}
  gameId="slots"
  onPlayMore={convertWinningsToCredits}
/>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 15px;
    width: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  }

  .top-controls {
    display: flex;
    width: 100%;
    max-width: 500px;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .spacer {
    flex: 1;
  }

  .control-btn {
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid #ffd700;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
    text-decoration: none;
  }

  .control-btn:hover {
    transform: scale(1.1);
    background: rgba(255, 215, 0, 0.3);
  }

  .control-btn.muted {
    opacity: 0.6;
  }

  .control-btn.end-btn {
    border-color: #ff6666;
  }

  .control-btn.end-btn:hover {
    background: rgba(255, 100, 100, 0.3);
  }

  .control-btn :global(svg) {
    color: #ffd700;
  }

  .control-btn.end-btn :global(svg) {
    color: #ff6666;
  }

  .win-display {
    font-size: 2em;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 2px 2px 4px #000;
    margin-bottom: 15px;
  }

  .win-display.winner {
    color: #00ff00;
    text-shadow: 0 0 15px #0f0, 0 0 30px #0f0;
    animation: pulse 0.5s ease-in-out infinite alternate;
  }

  .win-display.counting {
    animation: countPulse 0.1s ease-in-out infinite alternate;
  }

  @keyframes countPulse {
    from { transform: scale(1); }
    to { transform: scale(1.02); }
  }

  @keyframes pulse {
    from { transform: scale(1); }
    to { transform: scale(1.05); }
  }

  .slot-machine {
    background: #1a1a2a;
    border-radius: 20px;
    padding: 15px;
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.8),
      inset 0 0 20px rgba(0, 0, 0, 0.5);
    border: 3px solid #333;
  }

  .reels-container {
    display: flex;
    gap: 10px;
  }

  .reel-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .symbol-cell {
    width: 95px;
    height: 85px;
    background: linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #333;
    transition: all 0.2s;
  }

  .symbol-cell.center-row {
    border-color: #555;
    background: linear-gradient(180deg, #3a3a4a 0%, #2a2a3a 100%);
  }

  .symbol-cell.spinning {
    opacity: 0.85;
    filter: blur(3px);
    transform: scale(0.95);
  }

  .bottom-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 500px;
    margin-top: 20px;
    gap: 10px;
  }

  .left-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 90px;
  }

  .info-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .info-label {
    font-size: 0.9em;
    color: #aaa;
    font-weight: bold;
  }

  .info-value {
    font-size: 1.3em;
    font-weight: bold;
    color: #fff;
  }

  .info-row.winnings {
    background: rgba(0, 255, 0, 0.1);
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid rgba(0, 255, 0, 0.3);
  }

  .winnings-value {
    color: #00ff00 !important;
    text-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
  }

  .center-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bet-adjust-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: #2a2a3a;
    color: #fff;
    font-size: 1.5em;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }

  .bet-adjust-btn:hover:not(:disabled) {
    background: #3a3a4a;
    transform: scale(1.1);
  }

  .bet-adjust-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .spin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 15px 30px;
    font-size: 1.2em;
    font-weight: bold;
    background: linear-gradient(180deg, #c94040 0%, #8b2020 100%);
    color: #fff;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    box-shadow:
      0 4px 15px rgba(0, 0, 0, 0.5),
      inset 0 2px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.2s;
    text-shadow: 1px 1px 2px #000;
  }

  .spin-btn:hover:not(:disabled) {
    transform: scale(1.05);
    background: linear-gradient(180deg, #d95050 0%, #9b3030 100%);
  }

  .spin-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .spin-btn:disabled {
    background: linear-gradient(180deg, #555 0%, #333 100%);
    cursor: not-allowed;
  }

  .spin-btn.spinning {
    background: linear-gradient(180deg, #ff9900 0%, #cc6600 100%);
  }

  .spin-btn.spinning :global(svg) {
    animation: spin 0.5s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .spin-btn.new-code {
    background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
    color: #000;
  }

  .spin-btn.claim {
    background: linear-gradient(180deg, #ff6600 0%, #cc4400 100%);
    color: #fff;
  }

  .right-controls {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 100px;
  }

  .side-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 0.75em;
    font-weight: bold;
    background: #2a2a3a;
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .side-btn:hover {
    background: #3a3a4a;
  }

  .side-btn.active {
    background: #4a4a5a;
    color: #0f0;
  }

  .claim-btn {
    padding: 8px 12px;
    font-size: 0.8em;
    background: linear-gradient(180deg, #ff6600 0%, #cc4400 100%);
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.1s;
    text-shadow: 1px 1px 2px #000;
  }

  .claim-btn:hover {
    transform: scale(1.05);
  }

  .enter-code-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .enter-code-btn {
    padding: 16px 32px;
    font-size: 1.3em;
    background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    font-weight: bold;
    transition: transform 0.1s;
  }

  .enter-code-btn:hover {
    transform: scale(1.05);
  }

  /* Tablet and small desktop */
  @media (max-width: 500px) {
    .bottom-controls {
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }

    .left-info {
      order: 1;
      flex-direction: row;
      gap: 20px;
      width: 100%;
      justify-content: center;
      margin-bottom: 5px;
    }

    .center-controls {
      order: 2;
      width: 100%;
      justify-content: center;
    }

    .right-controls {
      order: 3;
      flex-direction: row;
      flex-wrap: wrap;
      width: 100%;
      justify-content: center;
      margin-top: 5px;
      gap: 8px;
    }

    .claim-btn {
      display: none;
    }
  }

  /* Mobile phones */
  @media (max-width: 400px) {
    .container {
      padding: 8px;
    }

    .top-controls {
      margin-bottom: 8px;
    }

    .win-display {
      font-size: 1.5em;
      margin-bottom: 10px;
    }

    .slot-machine {
      padding: 10px;
      border-radius: 16px;
    }

    .reels-container {
      gap: 6px;
    }

    .reel-column {
      gap: 6px;
    }

    .symbol-cell {
      width: 72px;
      height: 65px;
      border-radius: 10px;
    }

    .symbol-cell :global(svg) {
      width: 45px;
      height: 45px;
    }

    .spin-btn {
      padding: 12px 24px;
      font-size: 1em;
    }

    .spin-btn :global(svg) {
      width: 20px;
      height: 20px;
    }

    .bet-adjust-btn {
      width: 36px;
      height: 36px;
      font-size: 1.3em;
    }

    .control-btn {
      width: 36px;
      height: 36px;
    }

    .control-btn :global(svg) {
      width: 18px;
      height: 18px;
    }

    .info-label {
      font-size: 0.85em;
    }

    .info-value {
      font-size: 1.1em;
    }

    .side-btn {
      padding: 6px 10px;
      font-size: 0.7em;
    }

    .side-btn :global(svg) {
      width: 14px;
      height: 14px;
    }
  }

  /* Very small phones */
  @media (max-width: 350px) {
    .symbol-cell {
      width: 62px;
      height: 58px;
    }

    .symbol-cell :global(svg) {
      width: 38px;
      height: 38px;
    }

    .slot-machine {
      padding: 8px;
    }

    .reels-container {
      gap: 4px;
    }

    .reel-column {
      gap: 4px;
    }

    .spin-btn {
      padding: 10px 18px;
      font-size: 0.9em;
    }

    .win-display {
      font-size: 1.3em;
    }
  }
</style>
