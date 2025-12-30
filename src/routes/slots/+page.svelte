<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import PrizeModal from "$lib/PrizeModal.svelte";
  import ScratchCodeModal from "$lib/ScratchCodeModal.svelte";
  import ClaimModal from "$lib/ClaimModal.svelte";
  import SlotSymbol from "$lib/SlotSymbols.svelte";
  import { ArrowLeft, Trophy, X, Volume2, VolumeX } from "lucide-svelte";

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
  const loseProb = 1 - totalProb;

  // Game state
  let currentPrize = $state(0);
  // Each reel shows 3 symbols [top, middle, bottom]
  let reels = $state<string[][]>([
    ["cherry", "plum", "lemon"],
    ["bell", "seven", "bar"],
    ["diamond", "star", "cherry"]
  ]);
  let prizeText = $state("INGRESA CÓDIGO");
  let muted = $state(false);
  let spinning = $state(false);
  let betSize = $state(1);

  // Reel animation offsets
  let reelOffsets = $state([0, 0, 0]);

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
    if (browser) {
      sounds = {
        spin: new Audio("https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"),
        win: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        bigWin: new Audio("https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3"),
        lose: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
      };

      // Restore session from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const session = JSON.parse(saved);
          if (session.credits > 0 || session.sessionWinnings > 0) {
            currentCode = session.code || "";
            credits = session.credits || 0;
            sessionWinnings = session.sessionWinnings || 0;
            hasActiveSession = true;
            prizeText = "¡GIRA Y GANA!";
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

  function maxBet() {
    for (let i = BET_STEPS.length - 1; i >= 0; i--) {
      if (BET_STEPS[i] <= credits) {
        betSize = BET_STEPS[i];
        return;
      }
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
    // All three middle symbols match
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
    } while (r[0][1] === r[1][1] && r[1][1] === r[2][1]); // Ensure middle row doesn't match
    return r;
  }

  function getNearMissReels(): string[][] {
    const symbol = allSymbols[Math.floor(Math.random() * 3)]; // Pick a valuable symbol
    const otherSymbol = allSymbols.find(s => s !== symbol) || "lemon";
    return [
      [getRandomSymbol(), symbol, getRandomSymbol()],
      [getRandomSymbol(), symbol, getRandomSymbol()],
      [getRandomSymbol(), otherSymbol, getRandomSymbol()] // Near miss - last one different
    ];
  }

  async function handleCodeSubmit(code: string): Promise<void> {
    const response = await fetch("/api/scratch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Código inválido");
    }

    currentCode = data.code;
    credits = data.plays;
    sessionWinnings = 0;
    hasActiveSession = true;
    betSize = Math.min(betSize, credits);
    if (betSize < 1) betSize = 1;
    prizeText = "¡GIRA Y GANA!";
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
    reels = [getRandomReelStrip(), getRandomReelStrip(), getRandomReelStrip()];
    prizeText = "INGRESA CÓDIGO";
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

  async function spin() {
    if (spinning || credits < betSize || !hasActiveSession) {
      if (autoplayActive) stopAutoplay();
      return;
    }

    spinning = true;
    credits -= betSize;
    currentPrize = 0;
    prizeText = "";
    playSound(sounds?.spin);

    // Animate spinning with offset animation
    const spinDuration = 2000;
    const spinInterval = 60;

    const spinAnimation = setInterval(() => {
      reels = [getRandomReelStrip(), getRandomReelStrip(), getRandomReelStrip()];
      reelOffsets = [
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      ];
    }, spinInterval);

    await new Promise((resolve) => setTimeout(resolve, spinDuration));
    clearInterval(spinAnimation);
    reelOffsets = [0, 0, 0];

    // Determine result
    const result = getPrize();

    if (result.amount > 0) {
      currentPrize = Math.min(result.amount * betSize, MAX_PRIZE);
      reels = getWinReels(result.symbol);
      prizeText = `¡GANASTE $${currentPrize}!`;
      sessionWinnings += currentPrize;

      if (currentPrize >= 50) {
        playSound(sounds?.bigWin);
      } else {
        playSound(sounds?.win);
      }
    } else {
      if (Math.random() < 0.3) {
        reels = getNearMissReels();
        prizeText = "¡CASI!";
      } else {
        reels = getLoseReels();
        prizeText = "¡OTRA VEZ!";
      }
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

<div class="container">
  <div class="slot-machine">
    <div class="machine-controls">
      <div class="control-left">
        <a href="/" class="control-btn back-btn" title="Volver al Menú">
          <ArrowLeft size={20} />
        </a>
        <button class="control-btn" onclick={openPrizeList} title="Ver Premios">
          <Trophy size={20} />
        </button>
      </div>
      <div class="control-right">
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
    </div>

    <div class="machine-title">TRAGAMONEDAS</div>
    <div class="machine-subtitle">¡3 Iguales Ganan!</div>

    <div class="reels-container">
      <div class="reels-frame">
        <div class="reels">
          {#each reels as reel, i}
            <div class="reel" class:spinning style="--offset: {reelOffsets[i]}px">
              <div class="reel-strip">
                {#each reel as symbol, j}
                  <div class="symbol-wrapper" class:center={j === 1}>
                    <SlotSymbol {symbol} size={55} />
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
        <!-- Win line indicator -->
        <div class="win-line"></div>
        <!-- Gradient overlays for classic look -->
        <div class="reel-shadow top"></div>
        <div class="reel-shadow bottom"></div>
      </div>
    </div>

    <div class="prize-display" class:winner={currentPrize > 0 && !spinning}>
      {prizeText}
    </div>

    {#if hasActiveSession}
      <div class="bet-control">
        <button class="bet-btn" onclick={decreaseBet} disabled={spinning || betSize <= MIN_BET}>−</button>
        <div class="bet-display">
          <span class="bet-label">APUESTA</span>
          <span class="bet-value">${betSize}</span>
        </div>
        <button class="bet-btn" onclick={increaseBet} disabled={spinning || betSize >= MAX_BET || BET_STEPS[BET_STEPS.indexOf(betSize) + 1] > credits}>+</button>
        <button class="max-bet-btn" onclick={maxBet} disabled={spinning || betSize >= credits}>MÁX</button>
      </div>

      <div class="machine-footer">
        <div class="footer-left">
          <div class="credits-display">
            <span class="credits-label">Créditos:</span>
            <span class="credits-value">${credits}</span>
          </div>
          {#if sessionWinnings > 0}
            <button class="claim-btn" onclick={openClaimModal}>
              Cobrar ${sessionWinnings}
            </button>
          {/if}
        </div>

        <div class="footer-right">
          {#if credits >= betSize}
            {#if autoplayActive}
              <button class="spin-btn stop-btn" onclick={stopAutoplay}>
                PARAR ({autoplaySpinsLeft})
              </button>
            {:else}
              <button
                class="spin-btn"
                onclick={spin}
                disabled={spinning}
                class:spinning
              >
                {#if spinning}
                  GIRANDO...
                {:else}
                  GIRAR
                {/if}
              </button>
            {/if}
          {:else}
            <button class="spin-btn new-code" onclick={openCodeModal}>
              NUEVO CÓDIGO
            </button>
          {/if}
        </div>
      </div>

      {#if credits >= betSize && !autoplayActive && !spinning}
        <div class="autoplay-control">
          <span class="autoplay-label">Auto:</span>
          {#each AUTOPLAY_OPTIONS as option}
            <button
              class="autoplay-btn"
              onclick={() => startAutoplay(option)}
              disabled={credits < betSize}
            >
              {option}
            </button>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="enter-code-container">
        <button class="enter-code-btn" onclick={openCodeModal}>
          Ingresar Código
        </button>
      </div>
    {/if}
  </div>
</div>

<PrizeModal bind:show={showPrizeModal} />
<ScratchCodeModal bind:show={showCodeModal} onCodeSubmit={handleCodeSubmit} />
<ClaimModal
  bind:show={showClaimModal}
  scratchCode={currentCode}
  totalWinnings={sessionWinnings}
/>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  }

  .slot-machine {
    position: relative;
    width: 100%;
    max-width: 380px;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 20px;
    padding: 20px;
    box-shadow:
      0 15px 40px rgba(0, 0, 0, 0.9),
      inset 0 0 30px rgba(255, 215, 0, 0.2);
    border: 3px solid #ffd700;
  }

  .machine-controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .control-left,
  .control-right {
    display: flex;
    gap: 8px;
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

  .machine-title {
    font-size: 2.2em;
    color: #ffd700;
    text-shadow:
      0 0 15px #ff0,
      3px 3px 10px #000;
    font-weight: bold;
    text-align: center;
  }

  .machine-subtitle {
    font-size: 1.1em;
    color: #fff;
    text-align: center;
    margin-bottom: 20px;
  }

  .reels-container {
    background: linear-gradient(180deg, #0a0a0a, #1a1a1a, #0a0a0a);
    border-radius: 15px;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow:
      inset 0 5px 20px rgba(0, 0, 0, 0.9),
      0 0 15px rgba(255, 215, 0, 0.3);
    border: 2px solid #333;
  }

  .reels-frame {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background: linear-gradient(90deg, #111 0%, #222 50%, #111 100%);
  }

  .reels {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 5px;
  }

  .reel {
    width: 90px;
    height: 180px;
    background: linear-gradient(
      180deg,
      #1a1a1a 0%,
      #e8e8e8 15%,
      #ffffff 50%,
      #e8e8e8 85%,
      #1a1a1a 100%
    );
    border-radius: 8px;
    overflow: hidden;
    box-shadow:
      inset 2px 0 8px rgba(0, 0, 0, 0.3),
      inset -2px 0 8px rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
  }

  .reel.spinning .reel-strip {
    animation: reelSpin 0.1s linear infinite;
  }

  .reel-strip {
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(var(--offset, 0));
    transition: transform 0.05s ease-out;
  }

  .symbol-wrapper {
    width: 100%;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
  }

  .symbol-wrapper.center {
    opacity: 1;
    transform: scale(1.1);
  }

  @keyframes reelSpin {
    0% { transform: translateY(-20px); }
    100% { transform: translateY(0); }
  }

  .win-line {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 3px;
    background: linear-gradient(90deg, transparent, #ffd700, transparent);
    transform: translateY(-50%);
    box-shadow: 0 0 10px #ffd700;
    pointer-events: none;
    z-index: 5;
  }

  .reel-shadow {
    position: absolute;
    left: 0;
    right: 0;
    height: 50px;
    pointer-events: none;
    z-index: 10;
  }

  .reel-shadow.top {
    top: 0;
    background: linear-gradient(
      180deg,
      rgba(10, 10, 10, 0.95) 0%,
      rgba(10, 10, 10, 0.7) 40%,
      transparent 100%
    );
  }

  .reel-shadow.bottom {
    bottom: 0;
    background: linear-gradient(
      0deg,
      rgba(10, 10, 10, 0.95) 0%,
      rgba(10, 10, 10, 0.7) 40%,
      transparent 100%
    );
  }

  .prize-display {
    text-align: center;
    font-size: 1.6em;
    font-weight: bold;
    color: #fff;
    min-height: 40px;
    margin-bottom: 15px;
    text-shadow: 2px 2px 5px #000;
  }

  .prize-display.winner {
    color: #00ff00;
    text-shadow: 0 0 10px #0f0, 0 0 20px #0f0;
    animation: pulse 0.5s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from { transform: scale(1); }
    to { transform: scale(1.05); }
  }

  .bet-control {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  .bet-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #ffd700;
    background: rgba(0, 0, 0, 0.5);
    color: #ffd700;
    font-size: 1.5em;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
  }

  .bet-btn:hover:not(:disabled) {
    transform: scale(1.1);
    background: rgba(255, 215, 0, 0.3);
  }

  .bet-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .max-bet-btn {
    padding: 8px 12px;
    border-radius: 8px;
    border: 2px solid #ffd700;
    background: rgba(0, 0, 0, 0.5);
    color: #ffd700;
    font-size: 0.9em;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
  }

  .max-bet-btn:hover:not(:disabled) {
    transform: scale(1.05);
    background: rgba(255, 215, 0, 0.3);
  }

  .max-bet-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .bet-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 70px;
  }

  .bet-label {
    font-size: 0.8em;
    color: #aaa;
  }

  .bet-value {
    font-size: 1.6em;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 8px #ffd700;
  }

  .machine-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }

  .footer-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .footer-right {
    display: flex;
    align-items: center;
  }

  .credits-display {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }

  .credits-label {
    font-size: 0.9em;
    color: #aaa;
  }

  .credits-value {
    font-size: 1.5em;
    font-weight: bold;
    color: #00bfff;
    text-shadow: 0 0 10px #00bfff;
  }

  .claim-btn {
    padding: 8px 16px;
    font-size: 0.95em;
    background: linear-gradient(#ff6600, #cc4400);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
    font-weight: bold;
    transition: transform 0.1s;
    text-shadow: 1px 1px 2px #000;
  }

  .claim-btn:hover {
    transform: scale(1.05);
  }

  .spin-btn {
    padding: 15px 30px;
    font-size: 1.3em;
    background: linear-gradient(#00dd00, #008800);
    color: #fff;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
    font-weight: bold;
    transition: transform 0.1s;
    text-shadow: 1px 1px 3px #000;
  }

  .spin-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .spin-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .spin-btn:disabled {
    background: linear-gradient(#555, #333);
    cursor: not-allowed;
  }

  .spin-btn.spinning {
    background: linear-gradient(#ff9900, #cc6600);
  }

  .spin-btn.new-code {
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
  }

  .spin-btn.stop-btn {
    background: linear-gradient(#ff4444, #cc2222);
  }

  .autoplay-control {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
  }

  .autoplay-label {
    font-size: 0.9em;
    color: #aaa;
  }

  .autoplay-btn {
    padding: 6px 12px;
    font-size: 0.9em;
    background: rgba(0, 0, 0, 0.5);
    color: #ffd700;
    border: 2px solid #ffd700;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.1s, background 0.2s;
  }

  .autoplay-btn:hover:not(:disabled) {
    transform: scale(1.05);
    background: rgba(255, 215, 0, 0.3);
  }

  .autoplay-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .enter-code-container {
    display: flex;
    justify-content: center;
    padding: 10px 0;
  }

  .enter-code-btn {
    padding: 14px 28px;
    font-size: 1.3em;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
    transition: transform 0.1s;
  }

  .enter-code-btn:hover {
    transform: scale(1.05);
  }

  @media (max-width: 400px) {
    .slot-machine {
      padding: 15px;
    }

    .machine-title {
      font-size: 1.8em;
    }

    .reel {
      width: 75px;
      height: 150px;
    }

    .symbol-wrapper {
      height: 50px;
    }

    .symbol-wrapper :global(svg) {
      width: 45px;
      height: 45px;
    }

    .spin-btn {
      padding: 12px 24px;
      font-size: 1.1em;
    }

    .control-btn {
      width: 34px;
      height: 34px;
    }

    .control-btn :global(svg) {
      width: 16px;
      height: 16px;
    }

    .bet-btn {
      width: 35px;
      height: 35px;
      font-size: 1.3em;
    }

    .bet-value {
      font-size: 1.4em;
    }

    .claim-btn {
      padding: 6px 12px;
      font-size: 0.85em;
    }
  }
</style>
