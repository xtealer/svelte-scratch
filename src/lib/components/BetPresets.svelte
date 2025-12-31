<script lang="ts">
  let {
    presets = [1, 2, 5, 10],
    currentBet = $bindable(1),
    maxBet,
    disabled = false,
    onBetChange,
  }: {
    presets?: number[];
    currentBet: number;
    maxBet: number;
    disabled?: boolean;
    onBetChange?: (bet: number) => void;
  } = $props();

  function selectBet(bet: number): void {
    if (bet <= maxBet && !disabled) {
      currentBet = bet;
      if (onBetChange) onBetChange(bet);
    }
  }

  function isAvailable(bet: number): boolean {
    return bet <= maxBet;
  }
</script>

<div class="bet-presets">
  {#each presets as bet}
    <button
      class="preset-btn"
      class:active={currentBet === bet}
      class:unavailable={!isAvailable(bet)}
      disabled={disabled || !isAvailable(bet)}
      onclick={() => selectBet(bet)}
    >
      ${bet}
    </button>
  {/each}

  {#if maxBet > 0}
    <button
      class="preset-btn max-btn"
      class:active={currentBet === maxBet && !presets.includes(maxBet)}
      disabled={disabled}
      onclick={() => selectBet(maxBet)}
    >
      MAX
    </button>
  {/if}
</div>

<style>
  .bet-presets {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .preset-btn {
    padding: 8px 14px;
    font-size: 0.9em;
    font-weight: bold;
    border: 2px solid #444;
    border-radius: 8px;
    background: #2a2a3a;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 48px;
  }

  .preset-btn:hover:not(:disabled) {
    background: #3a3a4a;
    border-color: #555;
    transform: translateY(-1px);
  }

  .preset-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .preset-btn.active {
    background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
    color: #000;
    border-color: #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
  }

  .preset-btn.active:hover {
    background: linear-gradient(180deg, #ffe44d 0%, #d4a00d 100%);
  }

  .preset-btn.unavailable {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .preset-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .max-btn {
    background: linear-gradient(180deg, #ff0064 0%, #cc0050 100%);
    color: #fff;
    border-color: #ff0064;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .max-btn:hover:not(:disabled) {
    background: linear-gradient(180deg, #ff3388 0%, #e6006c 100%);
    border-color: #ff3388;
  }

  .max-btn.active {
    box-shadow: 0 0 10px rgba(255, 0, 100, 0.5);
  }

  @media (max-width: 400px) {
    .preset-btn {
      padding: 6px 12px;
      font-size: 0.85em;
      min-width: 42px;
    }
  }
</style>
