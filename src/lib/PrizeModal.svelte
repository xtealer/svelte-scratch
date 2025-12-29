<script lang="ts">
  interface Prize {
    symbol: string;
    amount: number;
    odds: string;
  }

  let { show = $bindable(false) }: { show: boolean } = $props();

  const prizes: Prize[] = [
    { symbol: '⭐', amount: 500, odds: '1 in 1,958,000' },
    { symbol: '⭐', amount: 300, odds: '1 in 246,000' },
    { symbol: '🎰', amount: 200, odds: '1 in 388,000' },
    { symbol: '💎', amount: 100, odds: '1 in 71,000' },
    { symbol: '💰', amount: 50, odds: '1 in 55,500' },
    { symbol: '💰', amount: 40, odds: '1 in 52,000' },
    { symbol: '💰', amount: 25, odds: '1 in 27,800' },
    { symbol: '💰', amount: 20, odds: '1 in 4,900' },
    { symbol: '🪙', amount: 10, odds: '1 in 1,640' },
    { symbol: '🪶', amount: 5, odds: '1 in 1,210' },
    { symbol: '🪶', amount: 4, odds: '1 in 820' },
    { symbol: '🪶', amount: 2, odds: '1 in 250' },
    { symbol: '🪶', amount: 1, odds: '1 in 160' }
  ];

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
      <div class="modal-header">PRIZE LIST</div>
      {#each prizes as prize}
        <div class="prize-row">
          <span class="prize-symbol">{prize.symbol}</span>
          <span class="prize-amount">${prize.amount}</span>
          <span>{prize.odds}</span>
        </div>
      {/each}
      <button class="close-btn" onclick={close}>Close</button>
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
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
  }

  .modal-content {
    background: linear-gradient(#222, #333);
    border: 3px solid #ffd700;
    border-radius: 20px;
    padding: 20px;
    width: 100%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 0 30px #ff0;
  }

  .modal-header {
    font-size: 1.8em;
    margin-bottom: 15px;
    text-shadow: 0 0 10px #ff0;
    color: #ffd700;
    text-align: center;
  }

  .prize-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 10px;
    border-bottom: 1px solid #555;
    font-size: 1.2em;
    color: #ffd700;
  }

  .prize-row:last-of-type {
    border-bottom: none;
  }

  .prize-amount {
    font-weight: bold;
    color: #ffd700;
  }

  .prize-symbol {
    font-size: 1.4em;
  }

  .close-btn {
    margin-top: 20px;
    padding: 15px;
    font-size: 1.4em;
    width: 100%;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }

  .close-btn:hover {
    transform: scale(1.03);
  }

  @media (max-width: 480px) {
    .modal-content {
      padding: 15px;
    }
    .prize-row {
      font-size: 1.1em;
      padding: 10px;
    }
    .modal-header {
      font-size: 1.6em;
    }
  }
</style>
