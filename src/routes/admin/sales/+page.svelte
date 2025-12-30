<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { TrendingUp, ArrowLeft, DollarSign, ShoppingCart, Calendar, Filter, X } from 'lucide-svelte';
  import Footer from '$lib/Footer.svelte';
  import { initLanguage, t, getDirection, type Translations } from '$lib/i18n';

  interface Sale {
    _id: string;
    code: string;
    plays: number;
    price: number;
    sellerId?: string;
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

  interface User {
    _id: string;
    username: string;
    name: string;
    role: string;
  }

  let sales = $state<Sale[]>([]);
  let stats = $state<Stats | null>(null);
  let topSellers = $state<TopSeller[]>([]);
  let users = $state<User[]>([]);
  let loading = $state(true);
  let isAdmin = $state(false);
  let selectedSeller = $state<string>('');

  // i18n
  let i18n = $state<Translations | null>(null);
  let dir = $state<'ltr' | 'rtl'>('ltr');

  onMount(async () => {
    initLanguage();
    i18n = get(t);
    dir = getDirection();
    // Check for sellerId in URL params
    const urlSellerId = $page.url.searchParams.get('sellerId');
    if (urlSellerId) {
      selectedSeller = urlSellerId;
    }

    await checkAuth();
    await Promise.all([loadSales(), loadUsers()]);
  });

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (!data.authenticated) {
        goto('/admin');
        return;
      }
      isAdmin = data.user.role === 'admin' || data.user.role === 'super';
    } catch {
      goto('/admin');
    }
  }

  async function loadUsers() {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        users = data.users;
      }
    } catch {
      // Handle error
    }
  }

  async function loadSales() {
    loading = true;
    try {
      const url = selectedSeller
        ? `/api/admin/sales?sellerId=${selectedSeller}`
        : '/api/admin/sales';
      const res = await fetch(url);
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

  function handleFilterChange() {
    loadSales();
  }

  function clearFilter() {
    selectedSeller = '';
    loadSales();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }
</script>

<div class="admin-container" dir={dir}>
  <nav class="sidebar">
    <div class="sidebar-header">
      <h2>{i18n.common.casinoAdmin}</h2>
    </div>

    <ul class="nav-menu">
      <li>
        <a href="/admin/dashboard">
          <ArrowLeft size={20} />
          <span>{i18n.common.backToDashboard}</span>
        </a>
      </li>
    </ul>
  </nav>

  <main class="main-content">
    <header class="top-bar">
      <h1>
        <TrendingUp size={28} />
        <span>{i18n.sales.title}</span>
      </h1>
      {#if isAdmin && users.length > 0}
        <div class="filter-section">
          <Filter size={18} />
          <select bind:value={selectedSeller} onchange={handleFilterChange}>
            <option value="">{i18n.sales.allSellers}</option>
            {#each users as user}
              <option value={user._id}>{user.name} ({user.role})</option>
            {/each}
          </select>
          {#if selectedSeller}
            <button class="clear-filter" onclick={clearFilter}>
              <X size={16} />
            </button>
          {/if}
        </div>
      {/if}
    </header>

    {#if stats}
      <div class="stats-grid">
        <div class="stat-card">
          <DollarSign size={24} />
          <div class="stat-info">
            <span class="label">{i18n.sales.totalRevenue}</span>
            <span class="value">${stats.totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div class="stat-card">
          <ShoppingCart size={24} />
          <div class="stat-info">
            <span class="label">{i18n.sales.totalSales}</span>
            <span class="value">{stats.totalSales}</span>
          </div>
        </div>
        <div class="stat-card today">
          <Calendar size={24} />
          <div class="stat-info">
            <span class="label">{i18n.common.today}</span>
            <span class="value">{stats.todaySales} {i18n.sales.sales} - ${stats.todayRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div class="stat-card month">
          <Calendar size={24} />
          <div class="stat-info">
            <span class="label">{i18n.common.thisMonth}</span>
            <span class="value">{stats.monthSales} {i18n.sales.sales} - ${stats.monthRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    {/if}

    {#if isAdmin && topSellers.length > 0}
      <div class="top-sellers">
        <h3>{i18n.sales.topSellers}</h3>
        <div class="sellers-list">
          {#each topSellers as seller, i}
            <div class="seller-item">
              <span class="rank">#{i + 1}</span>
              <span class="name">{seller.sellerName}</span>
              <span class="sales">{seller.totalSales} {i18n.sales.sales}</span>
              <span class="revenue">${seller.totalRevenue.toFixed(2)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if loading}
      <div class="loading">{i18n.common.loading}</div>
    {:else}
      <div class="sales-table">
        <h3>{i18n.sales.recentSales}</h3>
        <table>
          <thead>
            <tr>
              <th>{i18n.sales.code}</th>
              <th>{i18n.sales.plays}</th>
              <th>{i18n.sales.price}</th>
              {#if isAdmin}
                <th>{i18n.sales.seller}</th>
              {/if}
              <th>{i18n.sales.date}</th>
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
          <p class="empty">{i18n.sales.noSalesYet}</p>
        {/if}
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
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
  }

  .top-bar h1 {
    margin: 0;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .filter-section {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #888;
  }

  .filter-section select {
    padding: 10px 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
    border-radius: 8px;
    color: #fff;
    font-size: 0.95em;
    cursor: pointer;
    min-width: 180px;
  }

  .filter-section select:focus {
    border-color: #ffd700;
    outline: none;
  }

  .clear-filter {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    border-radius: 6px;
    color: #ff6666;
    cursor: pointer;
  }

  .clear-filter:hover {
    background: rgba(255, 0, 0, 0.3);
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
    flex: 1;
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

    .top-bar {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-section {
      width: 100%;
    }

    .filter-section select {
      flex: 1;
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
