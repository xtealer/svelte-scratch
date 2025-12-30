<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { TrendingUp, ArrowLeft, DollarSign, ShoppingCart, Calendar } from 'lucide-svelte';

  interface Sale {
    _id: string;
    code: string;
    plays: number;
    price: number;
    sellerName: string;
    soldAt: string;
  }

  interface Stats {
    totalSales: number;
    totalRevenue: number;
    todaySales: number;
    todayRevenue: number;
    monthSales: number;
    monthRevenue: number;
  }

  interface TopSeller {
    sellerName: string;
    totalSales: number;
    totalRevenue: number;
  }

  let sales = $state<Sale[]>([]);
  let stats = $state<Stats | null>(null);
  let topSellers = $state<TopSeller[]>([]);
  let loading = $state(true);
  let isAdmin = $state(false);

  onMount(async () => {
    await checkAuth();
    await loadSales();
  });

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (!data.authenticated) {
        goto('/admin');
        return;
      }
      isAdmin = data.user.role === 'admin';
    } catch {
      goto('/admin');
    }
  }

  async function loadSales() {
    loading = true;
    try {
      const res = await fetch('/api/admin/sales');
      if (res.ok) {
        const data = await res.json();
        sales = data.sales;
        stats = data.stats;
        topSellers = data.topSellers || [];
      }
    } catch {
      // Handle error
    }
    loading = false;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }
</script>

<div class="admin-container">
  <nav class="sidebar">
    <div class="sidebar-header">
      <h2>Casino Admin</h2>
    </div>

    <ul class="nav-menu">
      <li>
        <a href="/admin/dashboard">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </a>
      </li>
    </ul>
  </nav>

  <main class="main-content">
    <header class="top-bar">
      <h1>
        <TrendingUp size={28} />
        <span>Sales</span>
      </h1>
    </header>

    {#if stats}
      <div class="stats-grid">
        <div class="stat-card">
          <DollarSign size={24} />
          <div class="stat-info">
            <span class="label">Total Revenue</span>
            <span class="value">${stats.totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div class="stat-card">
          <ShoppingCart size={24} />
          <div class="stat-info">
            <span class="label">Total Sales</span>
            <span class="value">{stats.totalSales}</span>
          </div>
        </div>
        <div class="stat-card today">
          <Calendar size={24} />
          <div class="stat-info">
            <span class="label">Today</span>
            <span class="value">{stats.todaySales} sales - ${stats.todayRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div class="stat-card month">
          <Calendar size={24} />
          <div class="stat-info">
            <span class="label">This Month</span>
            <span class="value">{stats.monthSales} sales - ${stats.monthRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    {/if}

    {#if isAdmin && topSellers.length > 0}
      <div class="top-sellers">
        <h3>Top Sellers</h3>
        <div class="sellers-list">
          {#each topSellers as seller, i}
            <div class="seller-item">
              <span class="rank">#{i + 1}</span>
              <span class="name">{seller.sellerName}</span>
              <span class="sales">{seller.totalSales} sales</span>
              <span class="revenue">${seller.totalRevenue.toFixed(2)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if loading}
      <div class="loading">Loading sales...</div>
    {:else}
      <div class="sales-table">
        <h3>Recent Sales</h3>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Plays</th>
              <th>Price</th>
              {#if isAdmin}
                <th>Seller</th>
              {/if}
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {#each sales as sale}
              <tr>
                <td class="code">{sale.code}</td>
                <td>{sale.plays}</td>
                <td class="price">${sale.price.toFixed(2)}</td>
                {#if isAdmin}
                  <td>{sale.sellerName}</td>
                {/if}
                <td class="date">{formatDate(sale.soldAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if sales.length === 0}
          <p class="empty">No sales yet</p>
        {/if}
      </div>
    {/if}
  </main>
</div>

<style>
  .admin-container {
    display: flex;
    min-height: 100vh;
    background: #0f0f1a;
  }

  .sidebar {
    width: 250px;
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border-right: 1px solid #333;
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

  .nav-menu {
    list-style: none;
    padding: 10px 0;
    margin: 0;
  }

  .nav-menu li a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    color: #aaa;
    text-decoration: none;
  }

  .nav-menu li a:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
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
    margin-bottom: 20px;
  }

  .top-bar h1 {
    margin: 0;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
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

  .stat-card :global(svg) {
    color: #00cc00;
  }

  .stat-card.today :global(svg) {
    color: #0096ff;
  }

  .stat-card.month :global(svg) {
    color: #ffd700;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-info .label {
    color: #888;
    font-size: 0.85em;
  }

  .stat-info .value {
    color: #fff;
    font-size: 1.2em;
    font-weight: bold;
  }

  .top-sellers {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    padding: 20px;
    margin-bottom: 24px;
  }

  .top-sellers h3 {
    margin: 0 0 16px 0;
    color: #ffd700;
  }

  .sellers-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .seller-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .rank {
    color: #ffd700;
    font-weight: bold;
    width: 30px;
  }

  .name {
    color: #fff;
    flex: 1;
  }

  .sales {
    color: #888;
  }

  .revenue {
    color: #00cc00;
    font-weight: bold;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #888;
  }

  .sales-table {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    padding: 20px;
  }

  .sales-table h3 {
    margin: 0 0 16px 0;
    color: #ffd700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    text-align: left;
    padding: 12px;
    border-bottom: 1px solid #333;
  }

  th {
    color: #888;
    font-size: 0.85em;
    font-weight: normal;
  }

  td {
    color: #fff;
  }

  .code {
    font-family: monospace;
    color: #ffd700;
  }

  .price {
    color: #00cc00;
    font-weight: bold;
  }

  .date {
    color: #888;
    font-size: 0.9em;
  }

  .empty {
    text-align: center;
    color: #666;
    padding: 20px;
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

    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }

    .sales-table {
      overflow-x: auto;
    }
  }

  @media (min-width: 1200px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }

    .top-sellers {
      display: grid;
      grid-template-columns: 1fr;
    }

    .sellers-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 12px;
    }
  }
</style>
