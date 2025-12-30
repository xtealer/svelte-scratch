<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import {
    LayoutDashboard,
    Users,
    Gamepad2,
    CreditCard,
    TrendingUp,
    Receipt,
    LogOut,
    DollarSign,
    ShoppingCart,
    Wallet,
    AlertCircle
  } from 'lucide-svelte';
  import Footer from '$lib/Footer.svelte';
  import { initLanguage, t, getDirection, type Translations } from '$lib/i18n';

  interface User {
    userId: string;
    username: string;
    name: string;
    role: 'super' | 'admin' | 'seller';
  }

  interface PrizeStats {
    prizeAmount: number;
    count: number;
    totalPaid: number;
    expectedOdds: number;
    actualOdds: number;
  }

  interface PlaysBreakdown {
    totalPlays: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    totalPrizesPaid: number;
  }

  interface PayoutRequestStats {
    total: number;
    pending: number;
    approved: number;
    paid: number;
    rejected: number;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
  }

  interface Stats {
    sales: {
      totalSales: number;
      totalRevenue: number;
      todaySales: number;
      todayRevenue: number;
      monthSales: number;
      monthRevenue: number;
    };
    payouts: {
      totalPayouts: number;
      totalAmount: number;
      todayPayouts: number;
      todayAmount: number;
    };
    cards: {
      total: number;
      used: number;
      unused: number;
      sold: number;
      totalValue: number;
      soldValue: number;
    } | null;
    prizeStats: PrizeStats[] | null;
    playsBreakdown: PlaysBreakdown | null;
    payoutRequests: PayoutRequestStats;
    recentSales: Array<{
      code: string;
      price: number;
      sellerName: string;
      soldAt: string;
    }>;
    recentPayouts: Array<{
      code: string;
      amount: number;
      paidByName: string;
      paidAt: string;
    }>;
    netProfit: number;
  }

  let user = $state<User | null>(null);
  let stats = $state<Stats | null>(null);
  let loading = $state(true);
  let error = $state('');

  // i18n
  let i18n = $state<Translations | null>(null);
  let dir = $state<'ltr' | 'rtl'>('ltr');

  onMount(async () => {
    initLanguage();
    i18n = get(t);
    dir = getDirection();
    await checkAuth();
    await loadStats();
  });

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (!data.authenticated) {
        goto('/admin');
        return;
      }
      user = data.user;
    } catch {
      goto('/admin');
    }
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        stats = await res.json();
      }
    } catch (e) {
      error = 'Failed to load stats';
    }
    loading = false;
  }

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    goto('/admin');
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }
</script>

<div class="admin-container" dir={dir}>
  <nav class="sidebar">
    <div class="sidebar-header">
      <h2>{i18n.common.casinoAdmin}</h2>
      {#if user}
        <span class="user-badge">{user.role}</span>
      {/if}
    </div>

    <ul class="nav-menu">
      <li class="active">
        <a href="/admin/dashboard">
          <LayoutDashboard size={20} />
          <span>{i18n.nav.dashboard}</span>
        </a>
      </li>
      {#if user?.role === 'admin' || user?.role === 'super'}
        <li>
          <a href="/admin/users">
            <Users size={20} />
            <span>{i18n.nav.users}</span>
          </a>
        </li>
        <li>
          <a href="/admin/games">
            <Gamepad2 size={20} />
            <span>{i18n.nav.games}</span>
          </a>
        </li>
      {/if}
      <li>
        <a href="/admin/cards">
          <CreditCard size={20} />
          <span>{i18n.nav.rechargeCards}</span>
        </a>
      </li>
      <li>
        <a href="/admin/sales">
          <TrendingUp size={20} />
          <span>{i18n.nav.sales}</span>
        </a>
      </li>
      <li>
        <a href="/admin/payouts">
          <Receipt size={20} />
          <span>{i18n.nav.payouts}</span>
        </a>
      </li>
    </ul>

    <div class="sidebar-footer">
      <button onclick={logout} class="logout-btn">
        <LogOut size={20} />
        <span>{i18n.nav.logout}</span>
      </button>
    </div>
  </nav>

  <main class="main-content">
    <header class="top-bar">
      <h1>{i18n.dashboard.title}</h1>
      {#if user}
        <span class="welcome">{i18n.common.welcome}, {user.name}</span>
      {/if}
    </header>

    {#if loading}
      <div class="loading">{i18n.common.loading}</div>
    {:else if error}
      <div class="error-msg">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    {:else if stats}
      <div class="stats-grid">
        <div class="stat-card revenue">
          <div class="stat-icon">
            <DollarSign size={24} />
          </div>
          <div class="stat-info">
            <span class="stat-label">{i18n.dashboard.totalRevenue}</span>
            <span class="stat-value">${stats.sales.totalRevenue.toFixed(2)}</span>
            <span class="stat-sub">{i18n.common.today}: ${stats.sales.todayRevenue.toFixed(2)}</span>
          </div>
        </div>

        <div class="stat-card sales">
          <div class="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div class="stat-info">
            <span class="stat-label">{i18n.dashboard.totalSales}</span>
            <span class="stat-value">{stats.sales.totalSales}</span>
            <span class="stat-sub">{i18n.common.today}: {stats.sales.todaySales}</span>
          </div>
        </div>

        <div class="stat-card payouts">
          <div class="stat-icon">
            <Wallet size={24} />
          </div>
          <div class="stat-info">
            <span class="stat-label">{i18n.dashboard.totalPayouts}</span>
            <span class="stat-value">${stats.payouts.totalAmount.toFixed(2)}</span>
            <span class="stat-sub">{i18n.common.today}: ${stats.payouts.todayAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="stat-card profit" class:negative={stats.netProfit < 0}>
          <div class="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div class="stat-info">
            <span class="stat-label">{i18n.dashboard.netProfit}</span>
            <span class="stat-value">${stats.netProfit.toFixed(2)}</span>
            <span class="stat-sub">{stats.netProfit >= 0 ? i18n.dashboard.positive : i18n.dashboard.negative}</span>
          </div>
        </div>
      </div>

      {#if stats.cards && (user?.role === 'admin' || user?.role === 'super')}
        <div class="cards-summary">
          <h3>{i18n.dashboard.rechargeCards}</h3>
          <div class="cards-stats">
            <div class="card-stat">
              <span class="label">{i18n.cardsAdmin.total}</span>
              <span class="value">{stats.cards.total}</span>
            </div>
            <div class="card-stat">
              <span class="label">{i18n.cardsAdmin.used}</span>
              <span class="value">{stats.cards.used}</span>
            </div>
            <div class="card-stat">
              <span class="label">{i18n.cardsAdmin.available}</span>
              <span class="value">{stats.cards.unused}</span>
            </div>
            <div class="card-stat">
              <span class="label">{i18n.cardsAdmin.sold}</span>
              <span class="value">{stats.cards.sold}</span>
            </div>
          </div>
        </div>
      {/if}

      {#if stats.payoutRequests}
        <div class="payout-requests-summary">
          <h3>{i18n.dashboard.payoutRequests}</h3>
          <div class="cards-stats">
            <div class="card-stat pending">
              <span class="label">{i18n.dashboard.pending}</span>
              <span class="value">{stats.payoutRequests.pending}</span>
              <span class="sub">${stats.payoutRequests.pendingAmount.toFixed(2)}</span>
            </div>
            <div class="card-stat">
              <span class="label">{i18n.dashboard.paid}</span>
              <span class="value">{stats.payoutRequests.paid}</span>
              <span class="sub">${stats.payoutRequests.paidAmount.toFixed(2)}</span>
            </div>
            <div class="card-stat">
              <span class="label">{i18n.cardsAdmin.total}</span>
              <span class="value">{stats.payoutRequests.total}</span>
            </div>
            {#if stats.payoutRequests.pending > 0}
              <a href="/admin/payouts" class="view-requests-btn">{i18n.dashboard.viewRequests} →</a>
            {/if}
          </div>
        </div>
      {/if}

      {#if stats.playsBreakdown && (user?.role === 'admin' || user?.role === 'super')}
        <div class="plays-summary">
          <h3>{i18n.dashboard.gameStatistics}</h3>
          <div class="cards-stats">
            <div class="card-stat">
              <span class="label">{i18n.dashboard.totalPlays}</span>
              <span class="value">{stats.playsBreakdown.totalPlays.toLocaleString()}</span>
            </div>
            <div class="card-stat win">
              <span class="label">{i18n.dashboard.wins}</span>
              <span class="value">{stats.playsBreakdown.totalWins.toLocaleString()}</span>
            </div>
            <div class="card-stat loss">
              <span class="label">{i18n.dashboard.losses}</span>
              <span class="value">{stats.playsBreakdown.totalLosses.toLocaleString()}</span>
            </div>
            <div class="card-stat">
              <span class="label">{i18n.dashboard.winRate}</span>
              <span class="value">{stats.playsBreakdown.winRate.toFixed(2)}%</span>
            </div>
            <div class="card-stat prize">
              <span class="label">{i18n.dashboard.prizesPaid}</span>
              <span class="value">${stats.playsBreakdown.totalPrizesPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>
      {/if}

      {#if stats.prizeStats && stats.prizeStats.length > 0 && (user?.role === 'admin' || user?.role === 'super')}
        <div class="prize-stats-panel">
          <h3>{i18n.dashboard.prizeDistribution}</h3>
          <table>
            <thead>
              <tr>
                <th>{i18n.dashboard.prize}</th>
                <th>{i18n.dashboard.count}</th>
                <th>{i18n.dashboard.totalPayouts}</th>
                <th>{i18n.dashboard.expectedOdds}</th>
                <th>{i18n.dashboard.actualOdds}</th>
                <th>{i18n.cardsAdmin.status}</th>
              </tr>
            </thead>
            <tbody>
              {#each stats.prizeStats as prize}
                <tr>
                  <td class="prize-amount">${prize.prizeAmount}</td>
                  <td>{prize.count.toLocaleString()}</td>
                  <td>${prize.totalPaid.toFixed(2)}</td>
                  <td>1 in {prize.expectedOdds.toLocaleString()}</td>
                  <td>{prize.actualOdds > 0 ? `1 in ${prize.actualOdds.toLocaleString()}` : '-'}</td>
                  <td>
                    {#if prize.actualOdds === 0}
                      <span class="odds-status neutral">-</span>
                    {:else if prize.actualOdds > prize.expectedOdds * 1.2}
                      <span class="odds-status good">{i18n.dashboard.under}</span>
                    {:else if prize.actualOdds < prize.expectedOdds * 0.8}
                      <span class="odds-status bad">{i18n.dashboard.over}</span>
                    {:else}
                      <span class="odds-status ok">{i18n.dashboard.normal}</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <div class="recent-section">
        <div class="recent-panel">
          <h3>{i18n.dashboard.recentSales}</h3>
          {#if stats.recentSales.length > 0}
            <table>
              <thead>
                <tr>
                  <th>{i18n.rechargeCard.code}</th>
                  <th>{i18n.sales.price}</th>
                  <th>{i18n.dashboard.seller}</th>
                  <th>{i18n.common.date}</th>
                </tr>
              </thead>
              <tbody>
                {#each stats.recentSales as sale}
                  <tr>
                    <td class="code">{sale.code}</td>
                    <td>${sale.price.toFixed(2)}</td>
                    <td>{sale.sellerName}</td>
                    <td>{formatDate(sale.soldAt)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="empty">{i18n.dashboard.noSalesYet}</p>
          {/if}
        </div>

        <div class="recent-panel">
          <h3>{i18n.dashboard.recentPayouts}</h3>
          {#if stats.recentPayouts.length > 0}
            <table>
              <thead>
                <tr>
                  <th>{i18n.rechargeCard.code}</th>
                  <th>{i18n.rechargeCard.amount}</th>
                  <th>{i18n.dashboard.paidBy}</th>
                  <th>{i18n.common.date}</th>
                </tr>
              </thead>
              <tbody>
                {#each stats.recentPayouts as payout}
                  <tr>
                    <td class="code">{payout.code}</td>
                    <td>${payout.amount.toFixed(2)}</td>
                    <td>{payout.paidByName}</td>
                    <td>{formatDate(payout.paidAt)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="empty">{i18n.dashboard.noPayoutsYet}</p>
          {/if}
        </div>
      </div>
    {/if}

    <Footer />
  </main>
</div>

<style>
  .admin-container {
    display: flex;
    min-height: 100vh;
    background: #0f0f1a;
  }

  .admin-container[dir="rtl"] {
    direction: rtl;
  }

  .sidebar {
    width: 250px;
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border-right: 1px solid #333;
    display: flex;
    flex-direction: column;
  }

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #333;
    text-align: center;
  }

  .sidebar-header h2 {
    margin: 0;
    color: #ffd700;
    font-size: 1.3em;
  }

  .user-badge {
    display: inline-block;
    margin-top: 8px;
    padding: 4px 12px;
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid #ffd700;
    border-radius: 12px;
    color: #ffd700;
    font-size: 0.75em;
    text-transform: uppercase;
  }

  .nav-menu {
    list-style: none;
    padding: 10px 0;
    margin: 0;
    flex: 1;
  }

  .nav-menu li a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    color: #aaa;
    text-decoration: none;
    transition: all 0.2s;
  }

  .nav-menu li a:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .nav-menu li.active a {
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
    border-left: 3px solid #ffd700;
  }

  .sidebar-footer {
    padding: 20px;
    border-top: 1px solid #333;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    border-radius: 8px;
    color: #ff6666;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background: rgba(255, 0, 0, 0.3);
  }

  .main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 1200px) {
    .main-content {
      padding: 30px 40px;
    }
  }

  @media (min-width: 1600px) {
    .main-content {
      padding: 40px 60px;
    }
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  .top-bar h1 {
    margin: 0;
    color: #fff;
  }

  .welcome {
    color: #888;
  }

  .loading, .error-msg {
    text-align: center;
    padding: 40px;
    color: #888;
  }

  .error-msg {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #ff6666;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  @media (min-width: 1200px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
  }

  .stat-card.revenue .stat-icon {
    background: rgba(0, 200, 0, 0.2);
    color: #00cc00;
  }

  .stat-card.sales .stat-icon {
    background: rgba(0, 150, 255, 0.2);
    color: #0096ff;
  }

  .stat-card.payouts .stat-icon {
    background: rgba(255, 150, 0, 0.2);
    color: #ff9600;
  }

  .stat-card.profit .stat-icon {
    background: rgba(0, 255, 150, 0.2);
    color: #00ff96;
  }

  .stat-card.profit.negative .stat-icon {
    background: rgba(255, 0, 0, 0.2);
    color: #ff4444;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-label {
    color: #888;
    font-size: 0.85em;
  }

  .stat-value {
    color: #fff;
    font-size: 1.5em;
    font-weight: bold;
  }

  .stat-sub {
    color: #666;
    font-size: 0.8em;
  }

  .cards-summary {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    padding: 20px;
    margin-bottom: 30px;
  }

  .cards-summary h3 {
    margin: 0 0 16px 0;
    color: #ffd700;
  }

  .cards-stats {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
  }

  .card-stat {
    display: flex;
    flex-direction: column;
  }

  .card-stat .label {
    color: #888;
    font-size: 0.85em;
  }

  .card-stat .value {
    color: #fff;
    font-size: 1.3em;
    font-weight: bold;
  }

  .recent-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    flex: 1;
  }

  @media (min-width: 1024px) {
    .recent-section {
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
  }

  .recent-panel {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    padding: 20px;
  }

  .recent-panel h3 {
    margin: 0 0 16px 0;
    color: #ffd700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid #333;
  }

  th {
    color: #888;
    font-size: 0.85em;
    font-weight: normal;
  }

  td {
    color: #fff;
    font-size: 0.9em;
  }

  td.code {
    font-family: monospace;
    color: #ffd700;
  }

  .empty {
    color: #666;
    text-align: center;
    padding: 20px;
  }

  .payout-requests-summary,
  .plays-summary,
  .prize-stats-panel {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    padding: 20px;
    margin-bottom: 20px;
  }

  .payout-requests-summary h3,
  .plays-summary h3,
  .prize-stats-panel h3 {
    margin: 0 0 16px 0;
    color: #ffd700;
  }

  .card-stat .sub {
    color: #666;
    font-size: 0.8em;
  }

  .card-stat.pending .value {
    color: #ff9900;
  }

  .card-stat.win .value {
    color: #00cc00;
  }

  .card-stat.loss .value {
    color: #ff6666;
  }

  .card-stat.prize .value {
    color: #ffd700;
  }

  .view-requests-btn {
    padding: 8px 16px;
    background: rgba(255, 153, 0, 0.2);
    border: 1px solid #ff9900;
    border-radius: 8px;
    color: #ff9900;
    text-decoration: none;
    font-size: 0.9em;
    transition: all 0.2s;
    align-self: center;
  }

  .view-requests-btn:hover {
    background: rgba(255, 153, 0, 0.3);
  }

  .prize-stats-panel {
    overflow-x: auto;
  }

  .prize-amount {
    color: #ffd700;
    font-weight: bold;
  }

  .odds-status {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85em;
  }

  .odds-status.good {
    background: rgba(0, 200, 0, 0.2);
    color: #00cc00;
  }

  .odds-status.bad {
    background: rgba(255, 0, 0, 0.2);
    color: #ff6666;
  }

  .odds-status.ok {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
  }

  .odds-status.neutral {
    background: rgba(100, 100, 100, 0.2);
    color: #888;
  }

  @media (max-width: 768px) {
    .admin-container {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #333;
    }

    .nav-menu {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      padding: 10px;
    }

    .nav-menu li a {
      padding: 10px 15px;
    }

    .nav-menu li a span {
      display: none;
    }

    .top-bar {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    .recent-panel {
      overflow-x: auto;
    }
  }
</style>
