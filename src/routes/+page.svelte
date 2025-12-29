<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import PrizeModal from '$lib/PrizeModal.svelte';

  interface PrizeConfig {
    amount: number;
    odds: number;
    prob?: number;
  }

  interface Sounds {
    scratch: HTMLAudioElement;
    coins: HTMLAudioElement;
    bigWin: HTMLAudioElement;
    noWin: HTMLAudioElement;
  }

  // Prize odds (50% RTP)
  const prizes: PrizeConfig[] = [
    { amount: 500, odds: 1958000 },
    { amount: 300, odds: 246000 },
    { amount: 200, odds: 388000 },
    { amount: 100, odds: 71000 },
    { amount: 50, odds: 55500 },
    { amount: 40, odds: 52000 },
    { amount: 25, odds: 27800 },
    { amount: 20, odds: 4900 },
    { amount: 10, odds: 1640 },
    { amount: 5, odds: 1210 },
    { amount: 4, odds: 820 },
    { amount: 2, odds: 250 },
    { amount: 1, odds: 160 },
    { amount: 0, odds: 0 }
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
    500: '⭐',
    300: '⭐',
    200: '🎰',
    100: '💎',
    50: '💰',
    40: '💰',
    25: '💰',
    20: '💰',
    10: '🪙',
    5: '🪶',
    4: '🪶',
    2: '🪶',
    1: '🪶'
  };

  const loseSymbols: string[] = ['🪙', '💰', '💎', '🪶', '🎰', '⭐'];
  const nearMissPrizes: number[] = [100, 100, 100, 50, 50, 50, 200, 300, 500, 40, 25, 20, 10];

  // State
  let ticketsBought = $state(0);
  let totalSpent = $state(0);
  let totalWon = $state(0);
  let currentPrize = $state(0);
  let symbols = $state<string[]>([]);
  let nearMissText = $state('');
  let prizeText = $state('-');
  let muted = $state(false);
  let showPrizeModal = $state(false);
  let revealed = $state(false);

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

  // Derived values
  let rtp = $derived(totalSpent > 0 ? ((totalWon / totalSpent) * 100).toFixed(2) : '0.00');

  onMount(() => {
    if (!browser) return;

    // Initialize sounds
    sounds = {
      scratch: new Audio(
        'https://cdn.pixabay.com/download/audio/2022/03/24/audio_8b5e3b1e1a.mp3?filename=scratch-card-scratch-1-6559.mp3'
      ),
      coins: new Audio(
        'https://cdn.pixabay.com/download/audio/2022/03/24/audio_4e7c88c4d3.mp3?filename=jackpot-coins-falling-10609.mp3'
      ),
      bigWin: new Audio(
        'https://cdn.pixabay.com/download/audio/2023/01/24/audio_2d7d0b8c4d.mp3?filename=winning-fanfare-1-143095.mp3'
      ),
      noWin: new Audio(
        'https://cdn.pixabay.com/download/audio/2022/03/24/audio_9c8f7d8c9d.mp3?filename=sad-trombone-1-6869.mp3'
      )
    };
    sounds.scratch.loop = true;
    Object.values(sounds).forEach((s) => s.load());

    ctx = canvas.getContext('2d');
    newTicket();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  });

  function playSound(key: keyof Sounds, volume = 1): void {
    if (muted || !sounds?.[key]) return;
    const sound = sounds[key];
    sound.currentTime = 0;
    sound.volume = volume;
    sound.play().catch(() => {});
  }

  function toggleMute(): void {
    muted = !muted;
  }

  function resizeCanvas(): void {
    if (!canvas || !scratchArea || !ctx) return;
    canvas.width = scratchArea.offsetWidth;
    canvas.height = scratchArea.offsetHeight;
    totalPixels = canvas.width * canvas.height;
    scratchedPixels = 0;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
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
      const sym = symbolMap[prize] || '🪙';
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

  function newTicket(): void {
    currentPrize = getPrize();
    symbols = generateSymbols(currentPrize);

    // Hide result
    prizeText = '-';
    revealed = false;

    // Near-miss on losers
    nearMissText = '';
    if (currentPrize === 0) {
      const nearPrize = getNearMissPrize();
      nearMissText = `Prize $${nearPrize}`;
    }

    ticketsBought++;
    totalSpent += 1;
    totalWon += currentPrize;

    // Need to wait for DOM update before resizing canvas
    setTimeout(resizeCanvas, 0);
  }

  function revealResult(): void {
    if (revealed) return; // Prevent playing sounds multiple times
    revealed = true;
    prizeText = currentPrize > 0 ? `WIN $${currentPrize}!` : 'SORRY';

    // Play win or lose sound when result is revealed
    if (currentPrize > 0) {
      playSound('coins', currentPrize >= 100 ? 1 : 0.7);
      if (currentPrize >= 100) playSound('bigWin', 0.8);
    } else {
      playSound('noWin', 0.6);
    }
  }

  function revealAll(): void {
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (sounds?.scratch) {
      sounds.scratch.pause();
    }
    revealResult();
  }

  function checkRevealProgress(): void {
    scratchedPixels += Math.PI * 50 * 50;
    if (scratchedPixels > totalPixels * 0.35) {
      revealResult();
    }
  }

  function getClampedPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX ?? 0;
    const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY ?? 0;
    const x = clientX - scratchAreaRect.left;
    const y = clientY - scratchAreaRect.top;
    return {
      x: Math.max(0, Math.min(x, canvas.width)),
      y: Math.max(0, Math.min(y, canvas.height))
    };
  }

  function startScratch(e: MouseEvent | TouchEvent): void {
    scratchAreaRect = scratchArea.getBoundingClientRect();
    isScratching = true;
    playSound('scratch', 0.5);
    scratch(e);
    document.addEventListener('mousemove', onDocumentScratch);
    document.addEventListener('touchmove', onDocumentScratch, { passive: false });
    document.addEventListener('mouseup', endScratch);
    document.addEventListener('touchend', endScratch);
  }

  function endScratch(): void {
    isScratching = false;
    if (sounds?.scratch) {
      sounds.scratch.pause();
    }
    document.removeEventListener('mousemove', onDocumentScratch);
    document.removeEventListener('touchmove', onDocumentScratch);
    document.removeEventListener('mouseup', endScratch);
    document.removeEventListener('touchend', endScratch);
    checkRevealProgress();
  }

  function onDocumentScratch(e: MouseEvent | TouchEvent): void {
    if (!isScratching) return;
    if ('touches' in e) e.preventDefault();
    scratch(e);
    checkRevealProgress();
  }

  function scratch(e: MouseEvent | TouchEvent): void {
    if (!ctx) return;
    const pos = getClampedPos(e);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
    ctx.fill();
  }

  function resetStats(): void {
    ticketsBought = 0;
    totalSpent = 0;
    totalWon = 0;
  }

  function openPrizeList(): void {
    showPrizeModal = true;
  }
</script>

<h1>GOLD RUSH</h1>
<p>Gana Hasta $1,000</p>
<p class="expected">Ver Tabla de Premios</p>

<div class="container">
  <div class="ticket">
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
  </div>
</div>

<div class="buttons">
  <button onclick={newTicket}>Buy New Ticket ($1)</button>
  <button onclick={revealAll}>Reveal All Instantly</button>
  <button onclick={openPrizeList}>View Prize List</button>
  <button class:mute={muted} onclick={toggleMute}>
    {muted ? 'Unmute Sounds' : 'Mute Sounds'}
  </button>
  <button onclick={resetStats}>Reset Stats</button>
</div>

<div class="stats">
  <p>Tickets Bought: <span>{ticketsBought}</span></p>
  <p>Total Spent: $<span>{totalSpent.toFixed(2)}</span></p>
  <p>Total Won: $<span>{totalWon.toFixed(2)}</span></p>
  <p>Current RTP: <span>{rtp}</span>%</p>
</div>

<PrizeModal bind:show={showPrizeModal} />

<style>
  h1 {
    font-size: 2.4em;
    text-shadow:
      0 0 15px #ff0,
      3px 3px 10px #000;
    margin: 10px 0;
  }

  p {
    margin: 5px 0;
  }

  .expected {
    font-size: 1.1em;
    margin: 8px 0;
    color: #ffaa00;
    font-weight: bold;
  }

  .container {
    width: 100%;
    max-width: 420px;
    margin: 10px auto;
  }

  .ticket {
    position: relative;
    width: 100%;
    padding-bottom: 140%;
    background: linear-gradient(135deg, #222, #444);
    border-radius: 20px;
    box-shadow:
      0 15px 40px rgba(0, 0, 0, 0.9),
      inset 0 0 30px #ff0;
    overflow: hidden;
  }

  .ticket-header {
    position: absolute;
    top: 6%;
    left: 0;
    right: 0;
    font-size: 1.8em;
    color: #ffd700;
    text-shadow: 3px 3px 10px #000;
    z-index: 10;
  }

  .scratch-area {
    position: absolute;
    top: 26%;
    left: 6%;
    width: 88%;
    height: 54%;
    background: #bbb;
    border-radius: 20px;
    box-shadow: inset 0 8px 20px rgba(0, 0, 0, 0.7);
    overflow: hidden;
    cursor: crosshair;
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

  .buttons {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 420px;
    gap: 12px;
    margin: 20px 0;
  }

  button {
    padding: 18px;
    font-size: 1.4em;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }

  button:hover,
  button:active {
    transform: scale(1.03);
  }

  button.mute {
    background: linear-gradient(#888, #555);
  }

  .stats {
    background: rgba(0, 0, 0, 0.7);
    padding: 18px;
    border-radius: 12px;
    width: 100%;
    max-width: 420px;
    font-size: 1.1em;
  }

  .stats p {
    margin: 10px 0;
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 2em;
    }
    .ticket-header {
      font-size: 1.5em;
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
    button {
      padding: 16px;
      font-size: 1.3em;
    }
    .stats {
      padding: 15px;
      font-size: 1em;
    }
  }
</style>
