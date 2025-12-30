<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import PrizeModal from "$lib/PrizeModal.svelte";
  import { prizes, symbolMap, loseSymbols, getPrize, getWinSymbols, getLoseSymbols, getNearMissSymbols } from "$lib/prizeConfig";

  // All possible symbols for spinning
  const allSymbols = ["💎", "⭐", "🎰", "💰", "🪙", "🪶"];

  // Game state
  let currentPrize = $state(0);
  let reels = $state<string[]>(["❓", "❓", "❓"]);
  let prizeText = $state("SPIN TO WIN!");
  let muted = $state(false);
  let spinning = $state(false);
  let credits = $state(100);
  let totalWinnings = $state(0);
  let showPrizeModal = $state(false);

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

  async function spin() {
    if (spinning || credits < 1) return;

    spinning = true;
    credits -= 1;
    prizeText = "";
    playSound(sounds?.spin);

    // Animate spinning
    const spinDuration = 2000;
    const spinInterval = 80;
    const startTime = Date.now();

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

    // Determine result
    currentPrize = getPrize();

    if (currentPrize > 0) {
      reels = getWinSymbols(currentPrize);
      prizeText = `YOU WIN $${currentPrize}!`;
      credits += currentPrize;
      totalWinnings += currentPrize;

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
  }

  function addCredits() {
    credits += 50;
  }
</script>

<div class="container">
  <div class="slot-machine">
    <div class="machine-controls">
      <a href="/" class="control-btn home-btn" title="Back to Menu">
        <span class="control-icon">🏠</span>
      </a>
      <div class="control-right">
        <button class="control-btn" onclick={openPrizeList} title="View Prize List">
          <span class="control-icon">🏆</span>
        </button>
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

    <div class="machine-footer">
      <div class="credits-display">
        <span class="credits-label">Credits:</span>
        <span class="credits-value">${credits}</span>
      </div>

      <button
        class="spin-btn"
        onclick={spin}
        disabled={spinning || credits < 1}
        class:spinning
      >
        {#if spinning}
          SPINNING...
        {:else if credits < 1}
          NO CREDITS
        {:else}
          SPIN ($1)
        {/if}
      </button>
    </div>

    <div class="bottom-controls">
      <button class="add-credits-btn" onclick={addCredits}>
        + Add $50 Credits
      </button>
      {#if totalWinnings > 0}
        <div class="total-winnings">
          Total Won: ${totalWinnings}
        </div>
      {/if}
    </div>
  </div>
</div>

<PrizeModal bind:show={showPrizeModal} />

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

  .machine-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }

  .credits-display {
    display: flex;
    flex-direction: column;
  }

  .credits-label {
    font-size: 0.9em;
    color: #aaa;
  }

  .credits-value {
    font-size: 1.8em;
    font-weight: bold;
    color: #00bfff;
    text-shadow: 0 0 10px #00bfff;
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

  .bottom-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .add-credits-btn {
    padding: 10px 20px;
    font-size: 1em;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.1s;
  }

  .add-credits-btn:hover {
    transform: scale(1.05);
  }

  .total-winnings {
    font-size: 1.1em;
    color: #00ff00;
    text-shadow: 0 0 5px #0f0;
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
  }
</style>
