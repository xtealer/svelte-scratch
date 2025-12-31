<script lang="ts">
  import { ChevronDown, ChevronUp } from 'lucide-svelte';
  import SlotSymbol from '$lib/SlotSymbols.svelte';

  type GameType = 'scratch' | 'slots';

  let {
    gameType = 'scratch' as GameType,
    expanded = $bindable(false),
    compact = true,
  }: {
    gameType?: GameType;
    expanded?: boolean;
    compact?: boolean;
  } = $props();

  interface Prize {
    symbol: string;
    amount: number;
    color: string;
  }

  const scratchPrizes: Prize[] = [
    { symbol: '💎', amount: 500, color: '#00ffff' },
    { symbol: '⭐', amount: 100, color: '#ffd700' },
    { symbol: '🎰', amount: 50, color: '#ff6600' },
    { symbol: '💰', amount: 20, color: '#00ff00' },
    { symbol: '🪙', amount: 10, color: '#ffcc00' },
    { symbol: '🍀', amount: 5, color: '#00cc00' },
    { symbol: '🪶', amount: 2, color: '#cc99ff' },
    { symbol: '🎲', amount: 1, color: '#ff9999' }
  ];

  const slotsPrizes: Prize[] = [
    { symbol: 'diamond', amount: 500, color: '#00ffff' },
    { symbol: 'seven', amount: 100, color: '#ff0000' },
    { symbol: 'bar', amount: 50, color: '#ffd700' },
    { symbol: 'bell', amount: 20, color: '#ffcc00' },
    { symbol: 'star', amount: 10, color: '#ff6600' },
    { symbol: 'cherry', amount: 5, color: '#ff3366' },
    { symbol: 'plum', amount: 2, color: '#9933ff' },
    { symbol: 'lemon', amount: 1, color: '#ffff00' }
  ];

  let prizes = $derived(gameType === 'scratch' ? scratchPrizes : slotsPrizes);
  let displayPrizes = $derived(compact && !expanded ? prizes.slice(0, 4) : prizes);

  function toggleExpand(): void {
    expanded = !expanded;
  }

  function getPrizeColor(amount: number): string {
    if (amount >= 100) return '#00ffff';
    if (amount >= 50) return '#ffd700';
    if (amount >= 20) return '#00ff00';
    if (amount >= 10) return '#ffcc00';
    return '#aaaaaa';
  }
</script>

<div class="mini-prize-table" class:expanded>
  <div class="prize-grid">
    {#each displayPrizes as prize}
      <div class="prize-item">
        <span class="prize-symbol">
          {#if gameType === 'slots'}
            <SlotSymbol symbol={prize.symbol} size={24} />
          {:else}
            {prize.symbol}
          {/if}
        </span>
        <span class="prize-amount" style="color: {getPrizeColor(prize.amount)}">
          ${prize.amount}
        </span>
      </div>
    {/each}
  </div>

  {#if compact && prizes.length > 4}
    <button class="toggle-btn" onclick={toggleExpand}>
      {#if expanded}
        <ChevronUp size={16} />
        <span>Less</span>
      {:else}
        <ChevronDown size={16} />
        <span>More</span>
      {/if}
    </button>
  {/if}
</div>

<style>
  .mini-prize-table {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 10px;
    padding: 8px;
    width: 100%;
    max-width: 280px;
  }

  .prize-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .expanded .prize-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .prize-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    gap: 2px;
  }

  .prize-symbol {
    font-size: 1.2em;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .prize-amount {
    font-size: 0.75em;
    font-weight: bold;
    text-shadow: 0 0 5px currentColor;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    margin-top: 6px;
    padding: 4px;
    background: transparent;
    border: none;
    color: #888;
    font-size: 0.75em;
    cursor: pointer;
    transition: color 0.2s;
  }

  .toggle-btn:hover {
    color: #ffd700;
  }

  @media (max-width: 400px) {
    .mini-prize-table {
      padding: 6px;
      max-width: 240px;
    }

    .prize-symbol {
      font-size: 1em;
    }

    .prize-amount {
      font-size: 0.7em;
    }
  }
</style>
