<script lang="ts">
  import { onMount } from 'svelte';
  import { Dices, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { t, initLanguage, direction } from '$lib/i18n';
  import { playerAuth, isPlayerLoggedIn } from '$lib/stores/playerAuth';
  import { goto } from '$app/navigation';
  import GameNavbar from '$lib/GameNavbar.svelte';

  type Bet = {
    id: string;
    gameId: string;
    betAmount: number;
    prizeAmount: number;
    symbol?: string;
    createdAt: string;
  };

  let bets = $state<Bet[]>([]);
  let loading = $state(true);
  let error = $state('');
  let total = $state(0);
  let currentPage = $state(1);
  const limit = 20;

  onMount(() => {
    initLanguage();

    // Check if logged in
    const authState = playerAuth.get();
    if (!authState.token) {
      goto('/');
      return;
    }

    fetchBets();
  });

  async function fetchBets(): Promise<void> {
    const authState = playerAuth.get();
    if (!authState.token) return;

    loading = true;
    error = '';

    try {
      const offset = (currentPage - 1) * limit;
      const response = await fetch(`/api/player/history?filter=bets&limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load bets');
      }

      bets = data.transactions || [];
      total = data.total || 0;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load bets';
    } finally {
      loading = false;
    }
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

  function getGameName(gameId: string): string {
    const names: Record<string, string> = {
      scratch: $t.gameMenu.scratchTitle,
      slots: $t.gameMenu.slotsTitle
    };
    return names[gameId] || gameId;
  }

  function getGameIcon(gameId: string): string {
    const icons: Record<string, string> = {
      scratch: '🎫',
      slots: '🎰'
    };
    return icons[gameId] || '🎮';
  }

  let totalPages = $derived(Math.ceil(total / limit));

  function goToPage(page: number): void {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    fetchBets();
  }
</script>

<svelte:head>
  <title>{$t.userMenu.betHistory} - Gold Games</title>
</svelte:head>

<GameNavbar />

<div class="page" dir={$direction}>
  {#if !$isPlayerLoggedIn}
    <div class="auth-required">
      <p>Please login to view your bet history</p>
      <a href="/" class="back-btn">Go to Home</a>
    </div>
  {:else}
    <main class="container">
      <div class="page-header">
        <a href="/" class="back-link">
          <ArrowLeft size={20} />
        </a>
        <div class="header-title">
          <Dices size={24} />
          <h1>{$t.userMenu.betHistory}</h1>
        </div>
      </div>

      <div class="content-card">
        {#if loading && bets.length === 0}
          <div class="loading-state">
            <span>{$t.transactionHistory.loading}</span>
          </div>
        {:else if error}
          <div class="error-state">
            <span>{error}</span>
          </div>
        {:else if bets.length === 0}
          <div class="empty-state">
            <Dices size={48} />
            <span>{$t.transactionHistory.noTransactions}</span>
          </div>
        {:else}
          <div class="bets-table-container">
            <table class="bets-table">
              <thead>
                <tr>
                  <th>{$t.transactionHistory.game}</th>
                  <th>{$t.transactionHistory.date}</th>
                  <th>{$t.transactionHistory.amount}</th>
                  <th>{$t.transactionHistory.prize}</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {#each bets as bet}
                  <tr class:win-row={bet.prizeAmount > 0}>
                    <td class="game-cell">
                      <span class="game-icon">{getGameIcon(bet.gameId || '')}</span>
                      <span class="game-name">{getGameName(bet.gameId || '')}</span>
                    </td>
                    <td class="date-cell">{formatDate(bet.createdAt)}</td>
                    <td class="amount-cell">-${bet.betAmount?.toFixed(2) || '0.00'}</td>
                    <td class="prize-cell" class:win={bet.prizeAmount > 0}>
                      {#if bet.prizeAmount > 0}
                        +${bet.prizeAmount.toFixed(2)}
                      {:else}
                        $0.00
                      {/if}
                    </td>
                    <td class="result-cell">
                      {#if bet.prizeAmount > 0}
                        <span class="result-badge win">{$t.transactionHistory.win}</span>
                      {:else}
                        <span class="result-badge loss">{$t.transactionHistory.loss}</span>
                      {/if}
                    </td>
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
            {total} total bets
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
    margin-bottom: 24px;
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

  .bets-table-container {
    overflow-x: auto;
  }

  .bets-table {
    width: 100%;
    border-collapse: collapse;
  }

  .bets-table th {
    background: #213743;
    color: #7f8c8d;
    font-weight: 500;
    text-align: left;
    padding: 14px 16px;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .bets-table td {
    padding: 14px 16px;
    color: #b1bad3;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .bets-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .win-row {
    background: rgba(0, 231, 1, 0.05);
  }

  .win-row:hover {
    background: rgba(0, 231, 1, 0.08) !important;
  }

  .game-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .game-icon {
    font-size: 1.2em;
  }

  .game-name {
    color: #fff;
    font-weight: 500;
  }

  .date-cell {
    color: #7f8c8d;
    font-size: 0.9em;
  }

  .amount-cell {
    color: #b1bad3;
    font-weight: 500;
  }

  .prize-cell {
    font-weight: 600;
    color: #7f8c8d;
  }

  .prize-cell.win {
    color: #00e701;
    text-shadow: 0 0 8px rgba(0, 231, 1, 0.5);
  }

  .result-cell {
    text-align: center;
  }

  .result-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: 600;
  }

  .result-badge.win {
    background: rgba(0, 231, 1, 0.15);
    color: #00e701;
  }

  .result-badge.loss {
    background: rgba(255, 68, 68, 0.15);
    color: #ff4444;
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

    .bets-table th,
    .bets-table td {
      padding: 10px 12px;
      font-size: 0.85em;
    }

    /* Hide date column on mobile */
    .bets-table th:nth-child(2),
    .bets-table td:nth-child(2) {
      display: none;
    }
  }

  @media (max-width: 400px) {
    /* Hide result column on very small screens */
    .bets-table th:nth-child(5),
    .bets-table td:nth-child(5) {
      display: none;
    }
  }
</style>
