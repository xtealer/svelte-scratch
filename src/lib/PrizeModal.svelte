<script lang="ts">
  import { t } from "$lib/i18n";
  import SlotSymbol from "$lib/SlotSymbols.svelte";

  interface Prize {
    symbol: string;
    amount: number;
    odds: number;
  }

  let { show = $bindable(false) }: { show: boolean } = $props();

  const prizes: Prize[] = [
    { symbol: 'diamond', amount: 500, odds: 8945 },
    { symbol: 'seven', amount: 100, odds: 3334 },
    { symbol: 'bar', amount: 50, odds: 1243 },
    { symbol: 'bell', amount: 20, odds: 463 },
    { symbol: 'star', amount: 10, odds: 173 },
    { symbol: 'cherry', amount: 5, odds: 64 },
    { symbol: 'plum', amount: 2, odds: 24 },
    { symbol: 'lemon', amount: 1, odds: 9 }
  ];

  function formatOdds(odds: number): string {
    return `${$t.prizeModal.odds} ${odds.toLocaleString()}`;
  }

  function close(): void {
    show = false;
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">{$t.prizeModal.title}</div>
      <div class="prize-info">
        <span class="prize-info-text">{$t.prizeModal.matchThree}</span>
      </div>
      {#each prizes as prize}
        <div class="prize-row">
          <div class="prize-symbols">
            <SlotSymbol symbol={prize.symbol} size={32} />
            <SlotSymbol symbol={prize.symbol} size={32} />
            <SlotSymbol symbol={prize.symbol} size={32} />
          </div>
          <span class="prize-amount">${prize.amount}</span>
          <span class="prize-odds">{formatOdds(prize.odds)}</span>
        </div>
      {/each}
      <button class="close-btn" onclick={close}>{$t.prizeModal.close}</button>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    z-index: 100;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px;
    padding-top: max(12px, env(safe-area-inset-top));
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }

  .modal-content {
    background: linear-gradient(#1a1a2a, #2a2a3a);
    border: 2px solid #ffd700;
    border-radius: 16px;
    padding: 16px;
    width: 100%;
    max-width: 360px;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
  }

  .modal-header {
    font-size: 1.3em;
    margin-bottom: 12px;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    color: #ffd700;
    text-align: center;
    font-weight: bold;
  }

  .prize-info {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 12px;
    text-align: center;
  }

  .prize-info-text {
    color: #ffd700;
    font-size: 0.85em;
  }

  .prize-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin-bottom: 6px;
    border: 1px solid #333;
  }

  .prize-row:last-of-type {
    margin-bottom: 0;
  }

  .prize-symbols {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .prize-amount {
    font-weight: bold;
    color: #00ff00;
    font-size: 1.1em;
    text-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
    min-width: 50px;
    text-align: center;
  }

  .prize-odds {
    color: #aaa;
    font-size: 0.75em;
    min-width: 80px;
    text-align: right;
  }

  .close-btn {
    margin-top: 14px;
    padding: 12px;
    font-size: 1em;
    width: 100%;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
    transition: transform 0.1s;
  }

  .close-btn:hover {
    transform: scale(1.02);
  }

  .close-btn:active {
    transform: scale(0.98);
  }

  @media (max-width: 400px) {
    .modal-content {
      padding: 12px;
      max-width: 320px;
    }

    .modal-header {
      font-size: 1.1em;
    }

    .prize-row {
      padding: 6px;
    }

    .prize-symbols {
      gap: 2px;
    }

    .prize-symbols :global(svg) {
      width: 26px;
      height: 26px;
    }

    .prize-amount {
      font-size: 1em;
      min-width: 45px;
    }

    .prize-odds {
      font-size: 0.7em;
      min-width: 70px;
    }
  }
</style>
