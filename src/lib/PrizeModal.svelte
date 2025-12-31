<script lang="ts">
  import { t } from "$lib/i18n";

  interface Prize {
    symbol: string;
    amount: number;
    odds: number;
  }

  let { show = $bindable(false) }: { show: boolean } = $props();

  const prizes: Prize[] = [
    { symbol: '💎', amount: 500, odds: 8945 },
    { symbol: '⭐', amount: 100, odds: 3334 },
    { symbol: '🎰', amount: 50, odds: 1243 },
    { symbol: '💰', amount: 20, odds: 463 },
    { symbol: '🪙', amount: 10, odds: 173 },
    { symbol: '🍀', amount: 5, odds: 64 },
    { symbol: '🪶', amount: 2, odds: 24 },
    { symbol: '🎲', amount: 1, odds: 9 }
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
      {#each prizes as prize}
        <div class="prize-row">
          <span class="prize-symbol">{prize.symbol}</span>
          <span class="prize-amount">${prize.amount}</span>
          <span>{formatOdds(prize.odds)}</span>
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
    background: linear-gradient(#222, #333);
    border: 3px solid #ffd700;
    border-radius: 16px;
    padding: 16px;
    width: 100%;
    max-width: 340px;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    box-shadow: 0 0 30px #ff0;
  }

  .modal-header {
    font-size: 1.4em;
    margin-bottom: 12px;
    text-shadow: 0 0 10px #ff0;
    color: #ffd700;
    text-align: center;
  }

  .prize-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 8px;
    border-bottom: 1px solid #444;
    font-size: 0.95em;
    color: #ffd700;
  }

  .prize-row:last-of-type {
    border-bottom: none;
  }

  .prize-amount {
    font-weight: bold;
    color: #ffd700;
    min-width: 50px;
    text-align: center;
  }

  .prize-symbol {
    font-size: 1.3em;
  }

  .close-btn {
    margin-top: 12px;
    padding: 12px;
    font-size: 1.2em;
    width: 100%;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }

  .close-btn:active {
    transform: scale(0.98);
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 20px;
      max-width: 380px;
    }
    .modal-header {
      font-size: 1.6em;
      margin-bottom: 16px;
    }
    .prize-row {
      font-size: 1.1em;
      padding: 12px 10px;
    }
    .prize-symbol {
      font-size: 1.4em;
    }
    .close-btn {
      margin-top: 16px;
      padding: 14px;
      font-size: 1.3em;
    }
  }
</style>
