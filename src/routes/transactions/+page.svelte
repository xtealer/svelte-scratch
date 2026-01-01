<script lang="ts">
  import { onMount } from 'svelte';
  import { History, ArrowLeft, ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { t, initLanguage, direction } from '$lib/i18n';
  import { playerAuth, isPlayerLoggedIn } from '$lib/stores/playerAuth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import GameNavbar from '$lib/GameNavbar.svelte';

  type FilterType = 'all' | 'deposits' | 'withdrawals';

  type Transaction = {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    status?: string;
    createdAt: string;
    details?: Record<string, unknown>;
  };

  let transactions = $state<Transaction[]>([]);
  let loading = $state(true);
  let error = $state('');
  let total = $state(0);
  let currentPage = $state(1);
  let filter = $state<FilterType>('all');
  const limit = 20;

  // Get initial filter from URL
  onMount(() => {
    initLanguage();

    // Check if logged in
    const authState = playerAuth.get();
    if (!authState.token) {
      goto('/');
      return;
    }

    // Check URL for filter param
    const urlFilter = $page.url.searchParams.get('filter');
    if (urlFilter === 'deposits' || urlFilter === 'withdrawals') {
      filter = urlFilter;
    }

    fetchTransactions();
  });

  async function fetchTransactions(): Promise<void> {
    const authState = playerAuth.get();
    if (!authState.token) return;

    loading = true;
    error = '';

    try {
      const offset = (currentPage - 1) * limit;
      const response = await fetch(`/api/player/history?filter=${filter}&limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load transactions');
      }

      transactions = data.transactions || [];
      total = data.total || 0;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load transactions';
    } finally {
      loading = false;
    }
  }

  function handleFilterChange(newFilter: FilterType): void {
    if (filter === newFilter) return;
    filter = newFilter;
    currentPage = 1;
    // Update URL without navigation
    const url = new URL(window.location.href);
    if (newFilter === 'all') {
      url.searchParams.delete('filter');
    } else {
      url.searchParams.set('filter', newFilter);
    }
    window.history.replaceState({}, '', url);
    fetchTransactions();
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      default: return status || '-';
    }
  }

  function getTypeLabel(type: string, details?: Record<string, unknown>): string {
    if (type === 'deposit') {
      if (details?.depositType === 'recharge') return $t.transactionHistory.rechargeCard;
      if (details?.depositType === 'crypto') return $t.transactionHistory.crypto;
      return $t.transactionHistory.deposit;
    }
    if (type === 'withdrawal') {
      if (details?.withdrawalType === 'crypto') return $t.transactionHistory.crypto;
      if (details?.withdrawalType === 'cash') return $t.transactionHistory.cash;
      return $t.transactionHistory.withdrawal;
    }
    return type;
  }

  let totalPages = $derived(Math.ceil(total / limit));

  function goToPage(page: number): void {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    fetchTransactions();
  }
</script>

<svelte:head>
  <title>{$t.userMenu.transactions} - Gold Games</title>
</svelte:head>

<GameNavbar />

<div class="page" dir={$direction}>
  {#if !$isPlayerLoggedIn}
    <div class="auth-required">
      <p>Please login to view your transactions</p>
      <a href="/" class="back-btn">Go to Home</a>
    </div>
  {:else}
    <main class="container">
      <div class="page-header">
        <a href="/" class="back-link">
          <ArrowLeft size={20} />
        </a>
        <div class="header-title">
          <History size={24} />
          <h1>{$t.userMenu.transactions}</h1>
        </div>
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
          <ArrowDownCircle size={16} />
          {$t.transactionHistory.deposits}
        </button>
        <button
          class="filter-tab"
          class:active={filter === 'withdrawals'}
          onclick={() => handleFilterChange('withdrawals')}
        >
          <ArrowUpCircle size={16} />
          {$t.transactionHistory.withdrawals}
        </button>
      </div>

      <div class="content-card">
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
            <History size={48} />
            <span>{$t.transactionHistory.noTransactions}</span>
          </div>
        {:else}
          <div class="transactions-table-container">
            <table class="transactions-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>{$t.transactionHistory.date}</th>
                  <th>{$t.transactionHistory.amount}</th>
                  {#if filter === 'all' || filter === 'withdrawals'}
                    <th>{$t.transactionHistory.status}</th>
                  {/if}
                </tr>
              </thead>
              <tbody>
                {#each transactions as tx}
                  <tr>
                    <td class="type-cell">
                      <div class="type-icon" class:deposit={tx.type === 'deposit'} class:withdrawal={tx.type === 'withdrawal'}>
                        {#if tx.type === 'deposit'}
                          <ArrowDownCircle size={20} />
                        {:else}
                          <ArrowUpCircle size={20} />
                        {/if}
                      </div>
                      <div class="type-info">
                        <span class="type-label">
                          {tx.type === 'deposit' ? $t.transactionHistory.deposit : $t.transactionHistory.withdrawal}
                        </span>
                        <span class="type-method">{getTypeLabel(tx.type, tx.details)}</span>
                      </div>
                    </td>
                    <td class="date-cell">{formatDate(tx.createdAt)}</td>
                    <td class="amount-cell" class:deposit={tx.type === 'deposit'} class:withdrawal={tx.type === 'withdrawal'}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    {#if filter === 'all' || filter === 'withdrawals'}
                      <td class="status-cell">
                        {#if tx.type === 'withdrawal' && tx.status}
                          <span class="status-badge" style="--status-color: {getStatusColor(tx.status)}">
                            {getStatusText(tx.status)}
                          </span>
                        {:else if tx.type === 'deposit'}
                          <span class="status-badge" style="--status-color: #00e701">
                            Completed
                          </span>
                        {:else}
                          -
                        {/if}
                      </td>
                    {/if}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          {#if totalPages > 1}
            <div class="pagination">
              <button
                class="page-btn"
                onclick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={18} />
              </button>

              <div class="page-info">
                <span>{currentPage}</span> / <span>{totalPages}</span>
              </div>

              <button
                class="page-btn"
                onclick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          {/if}

          <div class="total-info">
            {total} total transactions
          </div>
        {/if}
      </div>
    </main>
  {/if}
</div>

<style>
  .page {
    min-height: 100vh;
    min-height: 100dvh;
    background: #0f1923;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 16px;
    padding-top: max(80px, calc(env(safe-area-inset-top) + 70px));
  }

  .auth-required {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: #b1bad3;
    gap: 16px;
  }

  .back-btn {
    padding: 12px 24px;
    background: #00e701;
    color: #0f1923;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .back-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    color: #b1bad3;
    transition: all 0.2s;
  }

  .back-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #00bfff;
  }

  .header-title h1 {
    font-size: 1.5em;
    font-weight: 600;
    margin: 0;
    color: #fff;
  }

  .filter-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .filter-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #2d4a5e;
    border-radius: 8px;
    color: #b1bad3;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .filter-tab:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .filter-tab.active {
    background: rgba(0, 191, 255, 0.15);
    border-color: #00bfff;
    color: #00bfff;
  }

  .filter-tab :global(svg) {
    flex-shrink: 0;
  }

  .content-card {
    background: #1a2c38;
    border-radius: 12px;
    overflow: hidden;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #7f8c8d;
    gap: 16px;
  }

  .empty-state :global(svg) {
    color: #3d5a6c;
  }

  .error-state {
    color: #ff4444;
  }

  .transactions-table-container {
    overflow-x: auto;
  }

  .transactions-table {
    width: 100%;
    border-collapse: collapse;
  }

  .transactions-table th {
    background: #213743;
    color: #7f8c8d;
    font-weight: 500;
    text-align: left;
    padding: 14px 16px;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .transactions-table td {
    padding: 14px 16px;
    color: #b1bad3;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .transactions-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .type-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .type-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .type-icon.deposit {
    background: rgba(0, 231, 1, 0.15);
    color: #00e701;
  }

  .type-icon.withdrawal {
    background: rgba(249, 115, 22, 0.15);
    color: #f97316;
  }

  .type-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .type-label {
    color: #fff;
    font-weight: 600;
    font-size: 0.95em;
  }

  .type-method {
    color: #7f8c8d;
    font-size: 0.8em;
  }

  .date-cell {
    color: #7f8c8d;
    font-size: 0.9em;
  }

  .amount-cell {
    font-weight: 700;
    font-size: 1em;
  }

  .amount-cell.deposit {
    color: #00e701;
  }

  .amount-cell.withdrawal {
    color: #f97316;
  }

  .status-cell {
    text-align: center;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.1);
    color: var(--status-color, #b1bad3);
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .page-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 8px;
    color: #b1bad3;
    cursor: pointer;
    transition: all 0.2s;
  }

  .page-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-info {
    color: #b1bad3;
    font-size: 0.95em;
  }

  .page-info span:first-child {
    color: #fff;
    font-weight: 600;
  }

  .total-info {
    text-align: center;
    padding: 12px;
    color: #7f8c8d;
    font-size: 0.85em;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* Mobile */
  @media (max-width: 600px) {
    .container {
      padding: 12px;
      padding-top: max(70px, calc(env(safe-area-inset-top) + 60px));
    }

    .header-title h1 {
      font-size: 1.2em;
    }

    .filter-tabs {
      gap: 6px;
    }

    .filter-tab {
      padding: 10px 14px;
      font-size: 0.85em;
    }

    .transactions-table th,
    .transactions-table td {
      padding: 10px 12px;
      font-size: 0.85em;
    }

    .type-icon {
      width: 36px;
      height: 36px;
    }

    /* Hide date column on mobile */
    .transactions-table th:nth-child(2),
    .transactions-table td:nth-child(2) {
      display: none;
    }
  }

  @media (max-width: 400px) {
    .filter-tab {
      padding: 8px 12px;
      font-size: 0.8em;
    }

    .filter-tab :global(svg) {
      display: none;
    }
  }
</style>
