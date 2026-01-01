<script lang="ts">
  import { History, ArrowDownCircle, ArrowUpCircle, Dices, X, ChevronDown, ChevronUp } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import { playerAuth } from '$lib/stores/playerAuth';

  let {
    show = $bindable(false),
    initialFilter = 'all',
  }: {
    show: boolean;
    initialFilter?: 'all' | 'deposits' | 'withdrawals' | 'bets';
  } = $props();

  type FilterType = 'all' | 'deposits' | 'withdrawals' | 'bets';
  type Transaction = {
    id: string;
    type: 'deposit' | 'withdrawal' | 'bet';
    amount: number;
    status?: string;
    gameId?: string;
    prizeAmount?: number;
    createdAt: string;
    details?: Record<string, unknown>;
  };

  // State
  let filter = $state<FilterType>('all');
  let transactions = $state<Transaction[]>([]);
  let loading = $state(false);
  let error = $state('');
  let total = $state(0);
  let offset = $state(0);
  const limit = 20;

  // Fetch transactions when modal opens or filter changes
  $effect(() => {
    if (show) {
      filter = initialFilter;
      fetchTransactions();
    }
  });

  async function fetchTransactions(append = false): Promise<void> {
    const authState = playerAuth.get();
    if (!authState.token) return;

    loading = true;
    error = '';

    try {
      const currentOffset = append ? offset : 0;
      const response = await fetch(`/api/player/history?filter=${filter}&limit=${limit}&offset=${currentOffset}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load transactions');
      }

      if (append) {
        transactions = [...transactions, ...data.transactions];
      } else {
        transactions = data.transactions || [];
      }
      total = data.total || 0;
      offset = currentOffset + data.transactions.length;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load transactions';
    } finally {
      loading = false;
    }
  }

  function handleFilterChange(newFilter: FilterType): void {
    if (filter === newFilter) return;
    filter = newFilter;
    offset = 0;
    fetchTransactions();
  }

  function loadMore(): void {
    fetchTransactions(true);
  }

  function close(): void {
    show = false;
    filter = 'all';
    transactions = [];
    offset = 0;
    error = '';
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      close();
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getGameName(gameId: string): string {
    const names: Record<string, string> = {
      scratch: $t.gameMenu.scratchTitle,
      slots: $t.gameMenu.slotsTitle
    };
    return names[gameId] || gameId;
  }

  function getStatusColor(status?: string): string {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'approved': return '#00bfff';
      case 'rejected': return '#ff4444';
      case 'paid': return '#00e701';
      default: return '#b1bad3';
    }
  }

  function getStatusText(status?: string): string {
    switch (status) {
      case 'pending': return $t.transactionHistory.pending;
      case 'approved': return $t.transactionHistory.approved;
      case 'rejected': return $t.transactionHistory.rejected;
      case 'paid': return $t.transactionHistory.paid;
      default: return status || '';
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick} onkeydown={handleKeydown}>
    <div class="modal-content">
      <div class="modal-header">
        <div class="header-title">
          <History size={24} />
          <span>{$t.transactionHistory.title}</span>
        </div>
        <button class="close-btn" onclick={close}>
          <X size={20} />
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          class="filter-tab"
          class:active={filter === 'all'}
          onclick={() => handleFilterChange('all')}
        >
          {$t.transactionHistory.all}
        </button>
        <button
          class="filter-tab"
          class:active={filter === 'deposits'}
          onclick={() => handleFilterChange('deposits')}
        >
          {$t.transactionHistory.deposits}
        </button>
        <button
          class="filter-tab"
          class:active={filter === 'withdrawals'}
          onclick={() => handleFilterChange('withdrawals')}
        >
          {$t.transactionHistory.withdrawals}
        </button>
        <button
          class="filter-tab"
          class:active={filter === 'bets'}
          onclick={() => handleFilterChange('bets')}
        >
          {$t.transactionHistory.bets}
        </button>
      </div>

      <!-- Transaction List -->
      <div class="transaction-list">
        {#if loading && transactions.length === 0}
          <div class="loading-state">
            <span>{$t.transactionHistory.loading}</span>
          </div>
        {:else if error}
          <div class="error-state">
            <span>{error}</span>
          </div>
        {:else if transactions.length === 0}
          <div class="empty-state">
            <span>{$t.transactionHistory.noTransactions}</span>
          </div>
        {:else}
          {#each transactions as tx}
            <div class="transaction-item" class:bet-win={tx.type === 'bet' && (tx.prizeAmount ?? 0) > 0} class:bet-loss={tx.type === 'bet' && (tx.prizeAmount ?? 0) === 0}>
              <div class="tx-icon">
                {#if tx.type === 'deposit'}
                  <ArrowDownCircle size={24} class="deposit-icon" />
                {:else if tx.type === 'withdrawal'}
                  <ArrowUpCircle size={24} class="withdrawal-icon" />
                {:else}
                  <Dices size={24} class="bet-icon" />
                {/if}
              </div>

              <div class="tx-details">
                <div class="tx-type">
                  {#if tx.type === 'deposit'}
                    {$t.transactionHistory.deposit}
                    {#if tx.details?.depositType === 'recharge'}
                      <span class="tx-tag recharge">{$t.transactionHistory.rechargeCard}</span>
                    {:else if tx.details?.depositType === 'crypto'}
                      <span class="tx-tag crypto">{$t.transactionHistory.crypto}</span>
                    {/if}
                  {:else if tx.type === 'withdrawal'}
                    {$t.transactionHistory.withdrawal}
                    {#if tx.details?.withdrawalType === 'crypto'}
                      <span class="tx-tag crypto">{$t.transactionHistory.crypto}</span>
                    {:else if tx.details?.withdrawalType === 'cash'}
                      <span class="tx-tag cash">{$t.transactionHistory.cash}</span>
                    {/if}
                  {:else}
                    {$t.transactionHistory.bet}
                    {#if tx.gameId}
                      <span class="tx-tag game">{getGameName(tx.gameId)}</span>
                    {/if}
                  {/if}
                </div>
                <div class="tx-date">{formatDate(tx.createdAt)}</div>
              </div>

              <div class="tx-amount-section">
                {#if tx.type === 'deposit'}
                  <div class="tx-amount deposit">+${tx.amount.toFixed(2)}</div>
                {:else if tx.type === 'withdrawal'}
                  <div class="tx-amount withdrawal">-${tx.amount.toFixed(2)}</div>
                  {#if tx.status}
                    <div class="tx-status" style="color: {getStatusColor(tx.status)}">
                      {getStatusText(tx.status)}
                    </div>
                  {/if}
                {:else}
                  <div class="tx-bet-result">
                    <div class="tx-amount bet">-${tx.amount.toFixed(2)}</div>
                    {#if (tx.prizeAmount ?? 0) > 0}
                      <div class="tx-prize win">+${tx.prizeAmount?.toFixed(2)}</div>
                    {:else}
                      <div class="tx-prize loss">{$t.transactionHistory.loss}</div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/each}

          {#if transactions.length < total}
            <button class="load-more-btn" onclick={loadMore} disabled={loading}>
              {#if loading}
                {$t.transactionHistory.loading}
              {:else}
                {$t.transactionHistory.viewMore}
                <ChevronDown size={16} />
              {/if}
            </button>
          {/if}
        {/if}
      </div>

      <button class="close-modal-btn" onclick={close}>
        {$t.transactionHistory.close}
      </button>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    z-index: 1100;
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
    background: linear-gradient(#1a2c38, #213743);
    border: 3px solid #00bfff;
    border-radius: 16px;
    padding: 20px 16px;
    width: 100%;
    max-width: 500px;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 30px rgba(0, 191, 255, 0.3);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .header-title {
    font-size: 1.3em;
    text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
    color: #00bfff;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: #b1bad3;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .filter-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }

  .filter-tab {
    flex-shrink: 0;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #2d4a5e;
    border-radius: 8px;
    color: #b1bad3;
    font-size: 0.9em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-tab:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .filter-tab.active {
    background: rgba(0, 191, 255, 0.15);
    border-color: #00bfff;
    color: #00bfff;
  }

  .transaction-list {
    flex: 1;
    overflow-y: auto;
    min-height: 200px;
    max-height: 400px;
    margin-bottom: 16px;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #7f8c8d;
    text-align: center;
  }

  .error-state {
    color: #ff4444;
  }

  .transaction-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    margin-bottom: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: background 0.2s;
  }

  .transaction-item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .transaction-item.bet-win {
    border-color: rgba(0, 231, 1, 0.2);
    background: rgba(0, 231, 1, 0.05);
  }

  .transaction-item.bet-loss {
    border-color: rgba(255, 68, 68, 0.1);
  }

  .tx-icon {
    flex-shrink: 0;
  }

  .tx-icon :global(.deposit-icon) {
    color: #00e701;
  }

  .tx-icon :global(.withdrawal-icon) {
    color: #f97316;
  }

  .tx-icon :global(.bet-icon) {
    color: #00bfff;
  }

  .tx-details {
    flex: 1;
    min-width: 0;
  }

  .tx-type {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    color: #fff;
    font-weight: 600;
    font-size: 0.95em;
    margin-bottom: 4px;
  }

  .tx-tag {
    font-size: 0.75em;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
  }

  .tx-tag.recharge {
    background: rgba(255, 193, 7, 0.2);
    color: #ffc107;
  }

  .tx-tag.crypto {
    background: rgba(38, 161, 123, 0.2);
    color: #26a17b;
  }

  .tx-tag.cash {
    background: rgba(74, 222, 128, 0.2);
    color: #4ade80;
  }

  .tx-tag.game {
    background: rgba(0, 191, 255, 0.2);
    color: #00bfff;
  }

  .tx-date {
    color: #7f8c8d;
    font-size: 0.8em;
  }

  .tx-amount-section {
    flex-shrink: 0;
    text-align: right;
  }

  .tx-amount {
    font-weight: 700;
    font-size: 1em;
  }

  .tx-amount.deposit {
    color: #00e701;
  }

  .tx-amount.withdrawal {
    color: #f97316;
  }

  .tx-amount.bet {
    color: #b1bad3;
    font-size: 0.85em;
  }

  .tx-status {
    font-size: 0.75em;
    font-weight: 600;
    margin-top: 2px;
  }

  .tx-bet-result {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .tx-prize {
    font-weight: 700;
    font-size: 1em;
  }

  .tx-prize.win {
    color: #00e701;
    text-shadow: 0 0 8px rgba(0, 231, 1, 0.5);
  }

  .tx-prize.loss {
    color: #ff4444;
    font-size: 0.85em;
  }

  .load-more-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 12px;
    background: rgba(0, 191, 255, 0.1);
    border: 1px solid rgba(0, 191, 255, 0.3);
    border-radius: 8px;
    color: #00bfff;
    font-size: 0.9em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
  }

  .load-more-btn:hover:not(:disabled) {
    background: rgba(0, 191, 255, 0.2);
  }

  .load-more-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .close-modal-btn {
    padding: 14px;
    font-size: 1em;
    width: 100%;
    background: linear-gradient(#2d4a5e, #1a2c38);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-modal-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 24px 20px;
    }
  }

  @media (max-width: 400px) {
    .filter-tabs {
      gap: 4px;
    }

    .filter-tab {
      padding: 8px 12px;
      font-size: 0.8em;
    }

    .transaction-item {
      padding: 10px;
      gap: 10px;
    }

    .tx-type {
      font-size: 0.85em;
    }

    .tx-tag {
      font-size: 0.7em;
    }

    .tx-amount {
      font-size: 0.9em;
    }
  }
</style>
