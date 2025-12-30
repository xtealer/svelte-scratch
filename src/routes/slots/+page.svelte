<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import PrizeModal from "$lib/PrizeModal.svelte";
  import ScratchCodeModal from "$lib/ScratchCodeModal.svelte";
  import ClaimModal from "$lib/ClaimModal.svelte";
  import { prizes, symbolMap, loseSymbols, getPrize, getWinSymbols, getLoseSymbols, getNearMissSymbols } from "$lib/prizeConfig";

  const MAX_PRIZE = 500; // Cap max win at $500
  const MIN_BET = 1;
  const MAX_BET = 10;
  const BET_STEPS = [1, 2, 5, 10];

  // All possible symbols for spinning
  const allSymbols = ["💎", "⭐", "🎰", "💰", "🪙", "🪶"];

  // Game state
  let currentPrize = $state(0);
  let reels = $state<string[]>(["❓", "❓", "❓"]);
  let prizeText = $state("ENTER CODE TO PLAY");
  let muted = $state(false);
  let spinning = $state(false);
  let betSize = $state(1);

  // Session state
  let hasActiveSession = $state(false);
  let currentCode = $state("");
  let credits = $state(0);
  let sessionWinnings = $state(0);

  // Modals
  let showPrizeModal = $state(false);
  let showCodeModal = $state(false);
  let showClaimModal = $state(false);

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
    // Set to highest bet we can afford
    for (let i = BET_STEPS.length - 1; i >= 0; i--) {
      if (BET_STEPS[i] <= credits) {
        betSize = BET_STEPS[i];
        return;
      }
    }
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

    currentCode = data.code;
    credits = data.plays; // Each "play" is $1 credit
    sessionWinnings = 0;
    hasActiveSession = true;
    betSize = Math.min(betSize, credits);
    if (betSize < 1) betSize = 1;
    prizeText = "SPIN TO WIN!";
    reels = ["❓", "❓", "❓"];
  }

  function resetSession() {
    hasActiveSession = false;
    currentCode = "";
    credits = 0;
    sessionWinnings = 0;
    currentPrize = 0;
    reels = ["❓", "❓", "❓"];
    prizeText = "ENTER CODE TO PLAY";
    betSize = 1;
  }

  async function spin() {
    if (spinning || credits < betSize || !hasActiveSession) return;

    spinning = true;
    credits -= betSize;
    currentPrize = 0;
    prizeText = "";
    playSound(sounds?.spin);

    // Animate spinning
    const spinDuration = 2000;
    const spinInterval = 80;

    const spinAnimation = setInterval(() => {
      reels = [
        allSymbols[Math.floor(Math.random() * allSymbols.length)],
        allSymbols[Math.floor(Math.random() * allSymbols.length)],
        allSymbols[Math.floor(Math.random() * allSymbols.length)],
      ];
    }, spinInterval);

    // Wait for spin to complete
    await new Promise((resolve) => setTimeout(resolve, spinDuration));
    clearInterval(spinAnimation);

    // Determine base result
    let basePrize = getPrize();

    if (basePrize > 0) {
      // Calculate win with bet multiplier, capped at MAX_PRIZE
      currentPrize = Math.min(basePrize * betSize, MAX_PRIZE);

      reels = getWinSymbols(basePrize);
      prizeText = `YOU WIN $${currentPrize}!`;
      credits += currentPrize;
      sessionWinnings += currentPrize;

      if (currentPrize >= 50) {
        playSound(sounds?.bigWin);
      } else {
        playSound(sounds?.win);
      }
    } else {
      // 30% chance of near miss
      if (Math.random() < 0.3) {
        const nearMiss = getNearMissSymbols();
        reels = nearMiss.symbols;
        prizeText = "SO CLOSE!";
      } else {
        reels = getLoseSymbols();
        prizeText = "TRY AGAIN!";
      }
      playSound(sounds?.lose);
    }

    spinning = false;

    // Adjust bet if we can't afford current bet
    if (credits < betSize && credits > 0) {
      for (let i = BET_STEPS.length - 1; i >= 0; i--) {
        if (BET_STEPS[i] <= credits) {
          betSize = BET_STEPS[i];
          break;
        }
      }
    }
  }
</script>

<div class="container">
  <div class="slot-machine">
    <div class="machine-controls">
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

    <div class="machine-title">GOLD SLOTS</div>
    <div class="machine-subtitle">Match 3 to Win!</div>

    <div class="reels-container">
      <div class="reels" class:spinning>
        {#each reels as symbol, i}
          <div class="reel" class:spinning style="animation-delay: {i * 0.1}s">
            <span class="symbol">{symbol}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="prize-display" class:winner={currentPrize > 0 && !spinning}>
      {prizeText}
    </div>

    {#if hasActiveSession}
      <div class="bet-control">
        <button class="bet-btn" onclick={decreaseBet} disabled={spinning || betSize <= MIN_BET}>−</button>
        <div class="bet-display">
          <span class="bet-label">BET</span>
          <span class="bet-value">${betSize}</span>
        </div>
        <button class="bet-btn" onclick={increaseBet} disabled={spinning || betSize >= MAX_BET || BET_STEPS[BET_STEPS.indexOf(betSize) + 1] > credits}>+</button>
        <button class="max-bet-btn" onclick={maxBet} disabled={spinning || betSize >= credits}>MAX</button>
      </div>

      <div class="machine-footer">
        <div class="footer-left">
          <div class="credits-display">
            <span class="credits-label">Credits:</span>
            <span class="credits-value">${credits}</span>
          </div>
          {#if sessionWinnings > 0}
            <button class="claim-btn" onclick={openClaimModal}>
              Claim ${sessionWinnings}
            </button>
          {/if}
        </div>

        <div class="footer-right">
          {#if credits >= betSize}
            <button
              class="spin-btn"
              onclick={spin}
              disabled={spinning}
              class:spinning
            >
              {#if spinning}
                SPINNING...
              {:else}
                SPIN
              {/if}
            </button>
          {:else}
            <button class="spin-btn new-code" onclick={openCodeModal}>
              NEW CODE
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="enter-code-container">
        <button class="enter-code-btn" onclick={openCodeModal}>
          Enter Credits Code
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

  .control-icon {
    font-size: 1.2em;
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
    background: linear-gradient(#111, #222);
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: inset 0 5px 15px rgba(0, 0, 0, 0.8);
  }

  .reels {
    display: flex;
    justify-content: center;
    gap: 15px;
  }

  .reel {
    width: 80px;
    height: 100px;
    background: linear-gradient(#333, #222, #333);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      inset 0 3px 8px rgba(0, 0, 0, 0.6),
      0 2px 4px rgba(255, 215, 0, 0.2);
    border: 2px solid #555;
  }

  .reel.spinning {
    animation: reelSpin 0.1s infinite;
  }

  @keyframes reelSpin {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  .symbol {
    font-size: 3.5em;
    line-height: 1;
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
      width: 65px;
      height: 85px;
    }

    .symbol {
      font-size: 2.8em;
    }

    .spin-btn {
      padding: 12px 24px;
      font-size: 1.1em;
    }

    .control-btn {
      width: 34px;
      height: 34px;
    }

    .control-icon {
      font-size: 1em;
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
