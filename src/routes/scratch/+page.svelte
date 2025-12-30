<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import PrizeModal from "$lib/PrizeModal.svelte";
  import ScratchCodeModal from "$lib/ScratchCodeModal.svelte";
  import ClaimModal from "$lib/ClaimModal.svelte";

  interface PrizeConfig {
    amount: number;
    odds: number;
    prob?: number;
  }

  interface Sounds {
    coins: HTMLAudioElement;
    bigWin: HTMLAudioElement;
    noWin: HTMLAudioElement;
  }

  // Web Audio API for scratch sound
  let audioContext: AudioContext | null = null;
  let scratchNoiseSource: AudioBufferSourceNode | null = null;
  let scratchGain: GainNode | null = null;
  let isScratchSoundPlaying = false;
  let scratchSoundTimeout: ReturnType<typeof setTimeout> | null = null;

  // Prize odds (~50% RTP, ~18% win rate)
  // Based on 10,000 tickets = $5,000 total prizes
  const prizes: PrizeConfig[] = [
    { amount: 500, odds: 8945 },    // 1.1 in 10,000 ($560)
    { amount: 100, odds: 3334 },    // 3 in 10,000 ($300)
    { amount: 50, odds: 1243 },     // 8 in 10,000 ($402)
    { amount: 20, odds: 463 },      // 21.6 in 10,000 ($432)
    { amount: 10, odds: 173 },      // 57.8 in 10,000 ($578)
    { amount: 5, odds: 64 },        // 156 in 10,000 ($781)
    { amount: 2, odds: 24 },        // 417 in 10,000 ($833)
    { amount: 1, odds: 9 },         // 1,111 in 10,000 ($1,111)
    { amount: 0, odds: 0 },         // Loss
  ];

  // Calculate probabilities
  let totalProb = 0;
  prizes.forEach((p) => {
    if (p.amount > 0) totalProb += 1 / p.odds;
  });
  const loseProb = 1 - totalProb;
  prizes.forEach((p) => {
    p.prob = p.amount > 0 ? 1 / p.odds : loseProb;
  });

  const symbolMap: Record<number, string> = {
    500: "💎",
    100: "⭐",
    50: "🎰",
    20: "💰",
    10: "🪙",
    5: "🪙",
    2: "🪶",
    1: "🪶",
  };

  const loseSymbols: string[] = ["🪙", "💰", "💎", "🪶", "🎰", "⭐"];
  const nearMissPrizes: number[] = [500, 100, 100, 50, 50, 20, 20, 10, 10];

  // Game state
  let currentPrize = $state(0);
  let symbols = $state<string[]>([]);
  let nearMissText = $state("");
  let prizeText = $state("-");
  let muted = $state(false);
  let revealed = $state(false);

  // Session state (from scratch code)
  let currentCode = $state("");
  let playsLeft = $state(0);
  let sessionWinnings = $state(0);
  let hasActiveSession = $derived(currentCode !== "" && playsLeft >= 0);
  let canPlay = $derived(playsLeft > 0 && revealed);
  let canStartNewPlay = $derived(playsLeft > 0);

  // Modal state
  let showPrizeModal = $state(false);
  let showCodeModal = $state(false);
  let showClaimModal = $state(false);

  // Canvas state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let scratchArea: HTMLDivElement;
  let isScratching = false;
  let scratchAreaRect: DOMRect;
  let scratchedPixels = 0;
  let totalPixels = 0;

  // Sounds
  let sounds: Sounds | null = null;

  onMount(() => {
    if (!browser) return;

    // Initialize Web Audio API for scratch sound
    audioContext = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    // Initialize sounds
    sounds = {
      coins: new Audio(
        "https://cdn.pixabay.com/download/audio/2022/03/24/audio_4e7c88c4d3.mp3?filename=jackpot-coins-falling-10609.mp3"
      ),
      bigWin: new Audio(
        "https://cdn.pixabay.com/download/audio/2023/01/24/audio_2d7d0b8c4d.mp3?filename=winning-fanfare-1-143095.mp3"
      ),
      noWin: new Audio(
        "https://cdn.pixabay.com/download/audio/2022/03/24/audio_9c8f7d8c9d.mp3?filename=sad-trombone-1-6869.mp3"
      ),
    };
    Object.values(sounds).forEach((s) => s.load());

    ctx = canvas.getContext("2d");

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    // Initialize canvas with "Enter Code" message
    setTimeout(() => {
      resizeCanvas();
      showWelcomeMessage();
    }, 0);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
    };
  });

  function showWelcomeMessage(): void {
    symbols = ["❓", "❓", "❓"];
    prizeText = "Enter Code to Play";
    nearMissText = "";
  }

  function playSound(key: keyof Sounds, volume = 1): void {
    if (muted || !sounds?.[key]) return;
    const sound = sounds[key];
    sound.currentTime = 0;
    sound.volume = volume;
    sound.play().catch(() => {});
  }

  function toggleMute(): void {
    muted = !muted;
    if (muted) {
      stopScratchSound();
    }
  }

  function startScratchSound(): void {
    if (muted || !audioContext || isScratchSoundPlaying) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // Create noise buffer for scratch sound
    const bufferSize = audioContext.sampleRate * 0.5; // 0.5 second buffer
    const noiseBuffer = audioContext.createBuffer(
      1,
      bufferSize,
      audioContext.sampleRate
    );
    const output = noiseBuffer.getChannelData(0);

    // Generate filtered noise that sounds like scratching
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    // Create source node
    scratchNoiseSource = audioContext.createBufferSource();
    scratchNoiseSource.buffer = noiseBuffer;
    scratchNoiseSource.loop = true;

    // Create bandpass filter for scratch-like sound
    const bandpass = audioContext.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 2000;
    bandpass.Q.value = 0.5;

    // Create gain for volume control
    scratchGain = audioContext.createGain();
    scratchGain.gain.value = 0.3;

    // Connect nodes
    scratchNoiseSource.connect(bandpass);
    bandpass.connect(scratchGain);
    scratchGain.connect(audioContext.destination);

    scratchNoiseSource.start();
    isScratchSoundPlaying = true;
  }

  function stopScratchSound(): void {
    if (scratchSoundTimeout) {
      clearTimeout(scratchSoundTimeout);
      scratchSoundTimeout = null;
    }
    if (scratchNoiseSource && isScratchSoundPlaying) {
      try {
        scratchNoiseSource.stop();
      } catch {
        // Already stopped
      }
      scratchNoiseSource.disconnect();
      scratchNoiseSource = null;
    }
    if (scratchGain) {
      scratchGain.disconnect();
      scratchGain = null;
    }
    isScratchSoundPlaying = false;
  }

  function resizeCanvas(): void {
    if (!canvas || !scratchArea || !ctx) return;
    canvas.width = scratchArea.offsetWidth;
    canvas.height = scratchArea.offsetHeight;
    totalPixels = canvas.width * canvas.height;
    scratchedPixels = 0;
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";
    scratchAreaRect = scratchArea.getBoundingClientRect();
  }

  function getPrize(): number {
    const rand = Math.random();
    let cum = 0;
    for (const p of prizes) {
      cum += p.prob ?? 0;
      if (rand <= cum) return p.amount;
    }
    return 0;
  }

  function generateSymbols(prize: number): string[] {
    if (prize > 0) {
      const sym = symbolMap[prize] || "🪙";
      return [sym, sym, sym];
    } else {
      let shuffled = [...loseSymbols];
      do {
        shuffled = shuffled.sort(() => Math.random() - 0.5).slice(0, 3);
      } while (shuffled[0] === shuffled[1] && shuffled[1] === shuffled[2]);
      return shuffled;
    }
  }

  function getNearMissPrize(): number {
    return nearMissPrizes[Math.floor(Math.random() * nearMissPrizes.length)];
  }

  function startNewPlay(): void {
    if (playsLeft <= 0) return;

    currentPrize = getPrize();
    symbols = generateSymbols(currentPrize);

    // Hide result
    prizeText = "-";
    revealed = false;

    // Near-miss on losers
    nearMissText = "";
    if (currentPrize === 0) {
      const nearPrize = getNearMissPrize();
      nearMissText = `Prize $${nearPrize}`;
    }

    playsLeft--;

    // Need to wait for DOM update before resizing canvas
    setTimeout(resizeCanvas, 0);
  }

  function revealResult(): void {
    if (revealed) return; // Prevent playing sounds multiple times
    revealed = true;

    // Add winnings to session
    if (currentPrize > 0) {
      sessionWinnings += currentPrize;
    }

    prizeText =
      currentPrize > 0 ? `¡Ganaste $${currentPrize}!` : "¡Has Perdido!";

    // Play win or lose sound when result is revealed
    if (currentPrize > 0) {
      playSound("coins", currentPrize >= 100 ? 1 : 0.7);
      if (currentPrize >= 100) playSound("bigWin", 0.8);
    } else {
      playSound("noWin", 0.6);
    }
  }

  function revealAll(): void {
    if (!hasActiveSession || revealed) return;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    stopScratchSound();
    revealResult();
  }

  function checkRevealProgress(): void {
    scratchedPixels += Math.PI * 50 * 50;
    if (scratchedPixels > totalPixels * 0.35) {
      revealResult();
    }
  }

  function getClampedPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const clientX = "clientX" in e ? e.clientX : (e.touches?.[0]?.clientX ?? 0);
    const clientY = "clientY" in e ? e.clientY : (e.touches?.[0]?.clientY ?? 0);
    const x = clientX - scratchAreaRect.left;
    const y = clientY - scratchAreaRect.top;
    return {
      x: Math.max(0, Math.min(x, canvas.width)),
      y: Math.max(0, Math.min(y, canvas.height)),
    };
  }

  function startScratch(e: MouseEvent | TouchEvent): void {
    if (!hasActiveSession || revealed) return;

    scratchAreaRect = scratchArea.getBoundingClientRect();
    isScratching = true;
    scratch(e);

    document.addEventListener("mousemove", onDocumentScratch);
    document.addEventListener("touchmove", onDocumentScratch, {
      passive: false,
    });
    document.addEventListener("mouseup", endScratch);
    document.addEventListener("touchend", endScratch);
  }

  function endScratch(): void {
    isScratching = false;
    stopScratchSound();
    document.removeEventListener("mousemove", onDocumentScratch);
    document.removeEventListener("touchmove", onDocumentScratch);
    document.removeEventListener("mouseup", endScratch);
    document.removeEventListener("touchend", endScratch);
    checkRevealProgress();
  }

  function onDocumentScratch(e: MouseEvent | TouchEvent): void {
    if (!isScratching) return;
    if ("touches" in e) e.preventDefault();
    scratch(e);
    checkRevealProgress();

    // Play scratch sound only while moving
    startScratchSound();

    // Stop sound after 100ms of no movement
    if (scratchSoundTimeout) {
      clearTimeout(scratchSoundTimeout);
    }
    scratchSoundTimeout = setTimeout(() => {
      stopScratchSound();
    }, 100);
  }

  function scratch(e: MouseEvent | TouchEvent): void {
    if (!ctx) return;
    const pos = getClampedPos(e);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
    ctx.fill();
  }

  function openCodeModal(): void {
    showCodeModal = true;
  }

  function openPrizeList(): void {
    showPrizeModal = true;
  }

  function openClaimModal(): void {
    if (sessionWinnings > 0) {
      showClaimModal = true;
    }
  }

  function resetSession(): void {
    currentCode = "";
    playsLeft = 0;
    sessionWinnings = 0;
    revealed = false;
    showWelcomeMessage();
    setTimeout(resizeCanvas, 0);
  }

  async function handleCodeSubmit(code: string): Promise<void> {
    const response = await fetch("/api/scratch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to validate code");
    }

    // Load the session
    currentCode = data.code;
    playsLeft = data.plays;
    sessionWinnings = 0;

    // Start first play automatically
    startNewPlay();
  }
</script>

{#if hasActiveSession}
  <div class="session-info">
    <div class="info-item">
      <span class="label">Code:</span>
      <span class="value">{currentCode}</span>
    </div>
    <div class="info-item">
      <span class="label">Plays Left:</span>
      <span class="value plays">{playsLeft}</span>
    </div>
    <div class="info-item">
      <span class="label">Winnings:</span>
      <span class="value winnings">${sessionWinnings.toFixed(2)}</span>
    </div>
  </div>
{/if}

<div class="container">
  <div class="ticket">
    <div class="ticket-controls">
      <div class="control-left">
        <a href="/" class="control-btn home-btn" title="Back to Menu">
          <span class="control-icon">🏠</span>
        </a>
        <button class="control-btn" onclick={openPrizeList} title="View Prize List">
          <span class="control-icon">🏆</span>
        </button>
      </div>
      <div class="control-right">
        {#if hasActiveSession}
          <button class="control-btn end-btn" onclick={resetSession} title="End Session">
            <span class="control-icon">✕</span>
          </button>
        {/if}
        <button class="control-btn" class:muted={muted} onclick={toggleMute} title={muted ? "Unmute" : "Mute"}>
          <span class="control-icon">{muted ? "🔇" : "🔊"}</span>
        </button>
      </div>
    </div>
    <div class="ticket-title">GOLD RUSH</div>
    <div class="ticket-subtitle">Gana Hasta $500</div>
    <div class="ticket-header">MATCH 3 TO WIN!</div>
    <div
      class="scratch-area"
      bind:this={scratchArea}
      onmousedown={startScratch}
      ontouchstart={startScratch}
      role="application"
      aria-label="Scratch area - drag to reveal prize"
    >
      <div class="prize">
        <div class="near-miss">{nearMissText}</div>
        <div class="symbols">
          {#each symbols as symbol}
            <span>{symbol}</span>
          {/each}
        </div>
        <div class="prize-text">{prizeText}</div>
      </div>
      <canvas bind:this={canvas}></canvas>
    </div>
    <div class="ticket-footer">
      {#if hasActiveSession}
        <div class="footer-left">
          <div class="plays-counter">
            <span class="plays-label">Plays Left:</span>
            <span class="plays-value">{playsLeft}</span>
          </div>
          {#if sessionWinnings > 0}
            <button class="claim-btn" onclick={openClaimModal}>
              Claim ${sessionWinnings.toFixed(2)}
            </button>
          {/if}
        </div>
        <div class="footer-right">
          {#if !revealed}
            <button class="reveal-btn" onclick={revealAll}>
              Reveal
            </button>
          {:else if playsLeft > 0}
            <button class="next-play-btn" onclick={startNewPlay}>
              Next Play
            </button>
          {:else}
            <button class="next-play-btn" onclick={openCodeModal}>
              New Code
            </button>
          {/if}
        </div>
      {:else}
        <button class="enter-code-btn" onclick={openCodeModal}>
          Enter Scratch Code
        </button>
      {/if}
    </div>
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
  .session-info {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    background: rgba(0, 0, 0, 0.6);
    padding: 12px 20px;
    border-radius: 10px;
    margin: 10px auto;
    max-width: 420px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .info-item .label {
    font-size: 0.8em;
    color: #aaa;
  }

  .info-item .value {
    font-size: 1.2em;
    font-weight: bold;
    color: #ffd700;
  }

  .info-item .value.plays {
    color: #00bfff;
  }

  .info-item .value.winnings {
    color: #00ff00;
  }

  .container {
    width: 100%;
    max-width: 420px;
    margin: 10px auto;
  }

  .ticket {
    position: relative;
    width: 100%;
    padding-bottom: 150%;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 20px;
    box-shadow:
      0 15px 40px rgba(0, 0, 0, 0.9),
      inset 0 0 30px #ff0;
    overflow: hidden;
    border: 3px solid #ffd700;
  }

  .ticket-controls {
    position: absolute;
    top: 2%;
    left: 4%;
    right: 4%;
    display: flex;
    justify-content: space-between;
    z-index: 20;
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

  .control-btn:active {
    transform: scale(0.95);
  }

  .control-btn.muted {
    opacity: 0.6;
  }

  .control-icon {
    font-size: 1.2em;
  }

  .control-left {
    display: flex;
    gap: 8px;
  }

  .control-right {
    display: flex;
    gap: 8px;
  }

  .control-btn.end-btn {
    border-color: #ff6666;
  }

  .control-btn.end-btn:hover {
    background: rgba(255, 100, 100, 0.3);
  }

  .ticket-title {
    position: absolute;
    top: 8%;
    left: 0;
    right: 0;
    font-size: 2.2em;
    color: #ffd700;
    text-shadow:
      0 0 15px #ff0,
      3px 3px 10px #000;
    z-index: 10;
    font-weight: bold;
  }

  .ticket-subtitle {
    position: absolute;
    top: 14%;
    left: 0;
    right: 0;
    font-size: 1.2em;
    color: #fff;
    text-shadow: 2px 2px 8px #000;
    z-index: 10;
  }

  .ticket-header {
    position: absolute;
    top: 19%;
    left: 0;
    right: 0;
    font-size: 1.4em;
    color: #ffd700;
    text-shadow: 3px 3px 10px #000;
    z-index: 10;
  }

  .scratch-area {
    position: absolute;
    top: 26%;
    left: 6%;
    width: 88%;
    height: 46%;
    background: #bbb;
    border-radius: 20px;
    box-shadow: inset 0 8px 20px rgba(0, 0, 0, 0.7);
    overflow: hidden;
    cursor: crosshair;
  }

  .ticket-footer {
    position: absolute;
    bottom: 2%;
    left: 4%;
    right: 4%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    min-height: 60px;
  }

  .ticket-footer:has(.footer-left) {
    justify-content: space-between;
  }

  .footer-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .footer-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .plays-counter {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }

  .plays-label {
    font-size: 0.9em;
    color: #aaa;
  }

  .plays-value {
    font-size: 1.8em;
    font-weight: bold;
    color: #00bfff;
    text-shadow: 0 0 10px #00bfff;
  }

  .next-play-btn {
    padding: 12px 24px;
    font-size: 1.2em;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
    transition: transform 0.1s;
  }

  .next-play-btn:hover {
    transform: scale(1.05);
  }

  .next-play-btn:active {
    transform: scale(0.98);
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
    margin: 0 auto;
  }

  .enter-code-btn:hover {
    transform: scale(1.05);
  }

  .enter-code-btn:active {
    transform: scale(0.98);
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

  .claim-btn:active {
    transform: scale(0.98);
  }

  .reveal-btn {
    padding: 10px 20px;
    font-size: 1em;
    background: linear-gradient(#888, #555);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
    font-weight: bold;
    transition: transform 0.1s;
  }

  .reveal-btn:hover {
    transform: scale(1.05);
  }

  .reveal-btn:active {
    transform: scale(0.98);
  }

  .prize {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: radial-gradient(#222, #000);
    padding: 15px;
  }

  .near-miss {
    font-size: 1.8em;
    margin-bottom: 15px;
    color: #ff5555;
    text-shadow: 0 0 10px #f00;
    font-weight: bold;
  }

  .symbols {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-bottom: 30px;
  }

  .symbols span {
    font-size: 4em;
    line-height: 1;
  }

  .prize-text {
    font-size: 2.2em;
    font-weight: bold;
    text-shadow: 3px 3px 10px #000;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  @media (max-width: 480px) {
    .control-btn {
      width: 34px;
      height: 34px;
    }
    .control-icon {
      font-size: 1em;
    }
    .ticket-title {
      font-size: 1.8em;
    }
    .ticket-subtitle {
      font-size: 1em;
    }
    .ticket-header {
      font-size: 1.2em;
    }
    .next-play-btn {
      padding: 10px 18px;
      font-size: 1em;
    }
    .enter-code-btn {
      padding: 12px 20px;
      font-size: 1.1em;
    }
    .claim-btn {
      padding: 6px 12px;
      font-size: 0.85em;
    }
    .reveal-btn {
      padding: 8px 16px;
      font-size: 0.9em;
    }
    .plays-label {
      font-size: 0.8em;
    }
    .plays-value {
      font-size: 1.3em;
    }
    .near-miss {
      font-size: 1.5em;
    }
    .symbols {
      gap: 20px;
    }
    .symbols span {
      font-size: 3.2em;
    }
    .prize-text {
      font-size: 1.8em;
    }
    .session-info {
      gap: 15px;
      padding: 10px 15px;
    }
  }
</style>
