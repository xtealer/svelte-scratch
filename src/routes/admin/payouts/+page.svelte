<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import {
    Receipt,
    ArrowLeft,
    Plus,
    DollarSign,
    Wallet,
    Calendar,
    AlertCircle,
    Check,
    Clock,
    X,
    Phone,
    User,
    Globe,
    CheckCircle,
    XCircle,
    Ban
  } from 'lucide-svelte';
  import Footer from '$lib/Footer.svelte';
  import { initLanguage, t, getDirection, type Translations } from '$lib/i18n';

  interface Payout {
    _id: string;
    code: string;
    amount: number;
    paidByName: string;
    paidAt: string;
    notes?: string;
    playerName?: string;
    playerPhone?: string;
    playerCountry?: string;
  }

  interface PayoutRequest {
    _id: string;
    code: string;
    gameId: string;
    amount: number;
    playerName: string;
    playerPhone: string;
    playerCountry: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    createdAt: string;
    processedAt?: string;
    processedByName?: string;
    sellerName?: string;
    notes?: string;
  }

  interface Stats {
    totalPayouts: number;
    totalAmount: number;
    todayPayouts: number;
    todayAmount: number;
    monthPayouts: number;
    monthAmount: number;
  }

  interface RequestStats {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    pendingAmount: number;
  }

  type TabType = 'requests' | 'payouts';

  let payouts = $state<Payout[]>([]);
  let requests = $state<PayoutRequest[]>([]);
  let stats = $state<Stats | null>(null);
  let requestStats = $state<RequestStats | null>(null);
  let loading = $state(true);
  let isAdmin = $state(false);
  let activeTab = $state<TabType>('requests');
  let statusFilter = $state<string>('pending');

  // New payout form
  let showForm = $state(false);
  let payoutCode = $state('');
  let payoutAmount = $state<number | null>(null);
  let payoutNotes = $state('');
  let formError = $state('');
  let formSuccess = $state('');
  let submitting = $state(false);

  // Processing state
  let processingId = $state<string | null>(null);

  // i18n
  let i18n = $state<Translations | null>(null);
  let dir = $state<'ltr' | 'rtl'>('ltr');

  onMount(async () => {
    initLanguage();
    i18n = get(t);
    dir = getDirection();
    await checkAuth();
    await loadPayouts();
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

  async function loadPayouts() {
    loading = true;
    try {
      const res = await fetch('/api/admin/payouts');
      if (res.ok) {
        const data = await res.json();
        payouts = data.payouts || [];
        requests = data.requests || [];
        stats = data.stats;
        requestStats = data.requestStats;
      }
    } catch {
      // Handle error
    }
    loading = false;
  }

  async function checkCode() {
    if (!payoutCode) return;

    formError = '';
    try {
      const res = await fetch(`/api/admin/payouts?code=${encodeURIComponent(payoutCode)}`);
      const data = await res.json();

      if (data.payout) {
        formError = `This code was already paid on ${formatDate(data.payout.paidAt)} by ${data.payout.paidByName}`;
      }
    } catch {
      // Ignore
    }
  }

  async function submitPayout(e: Event) {
    e.preventDefault();
    formError = '';
    formSuccess = '';
    submitting = true;

    if (!payoutCode || !payoutAmount || payoutAmount <= 0) {
      formError = 'Please enter a valid code and amount';
      submitting = false;
      return;
    }

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: payoutCode,
          amount: payoutAmount,
          notes: payoutNotes || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        formError = data.error || 'Failed to register payout';
        submitting = false;
        return;
      }

      formSuccess = `Payout of $${payoutAmount.toFixed(2)} registered for ${payoutCode}`;
      payoutCode = '';
      payoutAmount = null;
      payoutNotes = '';

      await loadPayouts();

      setTimeout(() => {
        formSuccess = '';
        showForm = false;
      }, 3000);
    } catch {
      formError = 'Connection error';
    }
    submitting = false;
  }

  async function processRequest(requestId: string, action: 'approve' | 'reject' | 'pay', notes?: string) {
    processingId = requestId;
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          notes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to process request');
        processingId = null;
        return;
      }

      await loadPayouts();
    } catch {
      alert('Connection error');
    }
    processingId = null;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#ff9900';
      case 'approved': return '#0096ff';
      case 'paid': return '#00cc00';
      case 'rejected': return '#ff4444';
      default: return '#888';
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return i18n.payouts.pending;
      case 'approved': return i18n.payouts.approved;
      case 'paid': return i18n.payouts.paid;
      case 'rejected': return i18n.payouts.rejected;
      default: return status;
    }
  }

  let filteredRequests = $derived(
    statusFilter === 'all'
      ? requests
      : requests.filter(r => r.status === statusFilter)
  );
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
        <Receipt size={28} />
        <span>{i18n.payouts.title}</span>
      </h1>
      <button class="add-btn" onclick={() => showForm = true}>
        <Plus size={20} />
        <span>{i18n.payouts.registerPayout}</span>
      </button>
    </header>

    <!-- Request Stats Summary -->
    {#if requestStats}
      <div class="stats-grid">
        <div class="stat-card pending">
          <Clock size={24} />
          <div class="stat-info">
            <span class="label">{i18n.payouts.pendingRequests}</span>
            <span class="value">{requestStats.pending} - ${requestStats.pendingAmount.toFixed(2)}</span>
          </div>
        </div>
        <div class="stat-card">
          <Wallet size={24} />
          <div class="stat-info">
            <span class="label">{i18n.payouts.totalPaidOut}</span>
            <span class="value">${stats?.totalAmount.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        <div class="stat-card today">
          <Calendar size={24} />
          <div class="stat-info">
            <span class="label">{i18n.common.today}</span>
            <span class="value">{stats?.todayPayouts || 0} - ${stats?.todayAmount.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        <div class="stat-card month">
          <Calendar size={24} />
          <div class="stat-info">
            <span class="label">{i18n.common.thisMonth}</span>
            <span class="value">{stats?.monthPayouts || 0} - ${stats?.monthAmount.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Tabs -->
    <div class="tabs">
      <button
        class="tab"
        class:active={activeTab === 'requests'}
        onclick={() => activeTab = 'requests'}
      >
        <Clock size={18} />
        {i18n.payouts.requests}
        {#if requestStats && requestStats.pending > 0}
          <span class="badge">{requestStats.pending}</span>
        {/if}
      </button>
      <button
        class="tab"
        class:active={activeTab === 'payouts'}
        onclick={() => activeTab = 'payouts'}
      >
        <Check size={18} />
        {i18n.payouts.completedPayouts}
      </button>
    </div>

    {#if showForm}
      <div class="form-panel">
        <h3>{i18n.payouts.registerPrizePayment}</h3>

        {#if formError}
          <div class="form-error">
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        {/if}

        {#if formSuccess}
          <div class="form-success">
            <Check size={18} />
            <span>{formSuccess}</span>
          </div>
        {/if}

        <form onsubmit={submitPayout}>
          <div class="form-grid">
            <label>
              <span>{i18n.payouts.code}</span>
              <input
                type="text"
                bind:value={payoutCode}
                onblur={checkCode}
                placeholder="001-000000000"
                required
              />
            </label>
            <label>
              <span>{i18n.payouts.amount}</span>
              <input
                type="number"
                bind:value={payoutAmount}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
            </label>
          </div>

          <label class="notes-label">
            <span>{i18n.payouts.notesOptional}</span>
            <textarea
              bind:value={payoutNotes}
              placeholder=""
              rows="2"
            ></textarea>
          </label>

          <div class="form-actions">
            <button type="button" class="cancel-btn" onclick={() => showForm = false}>
              {i18n.cardsAdmin.cancel}
            </button>
            <button type="submit" class="submit-btn" disabled={submitting}>
              {submitting ? i18n.payouts.processing : i18n.payouts.registerPayout}
            </button>
          </div>
        </form>
      </div>
    {/if}

    {#if loading}
      <div class="loading">{i18n.common.loading}</div>
    {:else if activeTab === 'requests'}
      <!-- Payout Requests -->
      <div class="requests-section">
        <div class="section-header">
          <h3>{i18n.payouts.payoutRequests}</h3>
          <div class="status-filters">
            <button
              class="filter-btn"
              class:active={statusFilter === 'pending'}
              onclick={() => statusFilter = 'pending'}
            >
              {i18n.payouts.pending}
            </button>
            <button
              class="filter-btn"
              class:active={statusFilter === 'approved'}
              onclick={() => statusFilter = 'approved'}
            >
              {i18n.payouts.approved}
            </button>
            <button
              class="filter-btn"
              class:active={statusFilter === 'paid'}
              onclick={() => statusFilter = 'paid'}
            >
              {i18n.payouts.paid}
            </button>
            <button
              class="filter-btn"
              class:active={statusFilter === 'rejected'}
              onclick={() => statusFilter = 'rejected'}
            >
              {i18n.payouts.rejected}
            </button>
            <button
              class="filter-btn"
              class:active={statusFilter === 'all'}
              onclick={() => statusFilter = 'all'}
            >
              {i18n.payouts.all}
            </button>
          </div>
        </div>

        {#if filteredRequests.length === 0}
          <p class="empty">{i18n.payouts.noRequests}</p>
        {:else}
          <div class="requests-list">
            {#each filteredRequests as request}
              <div class="request-card">
                <div class="request-header">
                  <div class="request-code">{request.code}</div>
                  <div class="request-status" style="color: {getStatusColor(request.status)}">
                    {getStatusLabel(request.status)}
                  </div>
                </div>

                <div class="request-amount">${request.amount.toFixed(2)}</div>

                <div class="request-player">
                  <div class="player-info">
                    <User size={16} />
                    <span>{request.playerName}</span>
                  </div>
                  <div class="player-info">
                    <Phone size={16} />
                    <span>{request.playerPhone}</span>
                  </div>
                  <div class="player-info">
                    <Globe size={16} />
                    <span>{request.playerCountry}</span>
                  </div>
                </div>

                <div class="request-meta">
                  <span class="game-badge">{request.gameId}</span>
                  <span class="request-date">{formatDate(request.createdAt)}</span>
                  {#if request.sellerName}
                    <span class="seller-info">{i18n.dashboard.seller}: {request.sellerName}</span>
                  {/if}
                </div>

                {#if request.processedAt}
                  <div class="processed-info">
                    {i18n.payouts.processed} {formatDate(request.processedAt)}
                    {#if request.processedByName}
                      {i18n.payouts.by} {request.processedByName}
                    {/if}
                  </div>
                {/if}

                {#if request.notes}
                  <div class="request-notes">{request.notes}</div>
                {/if}

                <!-- Action Buttons -->
                {#if request.status === 'pending'}
                  <div class="request-actions">
                    <button
                      class="action-btn approve"
                      onclick={() => processRequest(request._id, 'approve')}
                      disabled={processingId === request._id}
                    >
                      <CheckCircle size={16} />
                      {i18n.payouts.approve}
                    </button>
                    <button
                      class="action-btn reject"
                      onclick={() => processRequest(request._id, 'reject')}
                      disabled={processingId === request._id}
                    >
                      <XCircle size={16} />
                      {i18n.payouts.reject}
                    </button>
                  </div>
                {:else if request.status === 'approved'}
                  <div class="request-actions">
                    <button
                      class="action-btn pay"
                      onclick={() => processRequest(request._id, 'pay')}
                      disabled={processingId === request._id}
                    >
                      <DollarSign size={16} />
                      {i18n.payouts.markAsPaid}
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- Completed Payouts -->
      <div class="payouts-table">
        <h3>{i18n.payouts.recentPayouts}</h3>
        <table>
          <thead>
            <tr>
              <th>{i18n.payouts.code}</th>
              <th>{i18n.payouts.amount}</th>
              <th>{i18n.payouts.player}</th>
              {#if isAdmin}
                <th>{i18n.payouts.paidBy}</th>
              {/if}
              <th>{i18n.common.date}</th>
              <th>{i18n.common.notes}</th>
            </tr>
          </thead>
          <tbody>
            {#each payouts as payout}
              <tr>
                <td class="code">{payout.code}</td>
                <td class="amount">${payout.amount.toFixed(2)}</td>
                <td class="player-cell">
                  {#if payout.playerName}
                    <div>{payout.playerName}</div>
                    {#if payout.playerPhone}
                      <div class="player-phone">{payout.playerPhone}</div>
                    {/if}
                  {:else}
                    -
                  {/if}
                </td>
                {#if isAdmin}
                  <td>{payout.paidByName}</td>
                {/if}
                <td class="date">{formatDate(payout.paidAt)}</td>
                <td class="notes">{payout.notes || '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if payouts.length === 0}
          <p class="empty">{i18n.payouts.noPayoutsYet}</p>
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
    margin-bottom: 20px;
  }

  .top-bar h1 {
    margin: 0;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(180deg, #ff9900 0%, #cc6600 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
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
    color: #ff9900;
  }

  .stat-card.today :global(svg) {
    color: #0096ff;
  }

  .stat-card.month :global(svg) {
    color: #ffd700;
  }

  .stat-card.pending :global(svg) {
    color: #ff9900;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid #333;
    border-radius: 8px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab:hover {
    color: #fff;
    border-color: #555;
  }

  .tab.active {
    background: linear-gradient(180deg, #ff9900 0%, #cc6600 100%);
    color: #fff;
    border-color: #ff9900;
  }

  .tab .badge {
    background: #ff4444;
    color: #fff;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: bold;
  }

  .tab.active .badge {
    background: rgba(255, 255, 255, 0.3);
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

  .form-panel {
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid #ff9900;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .form-panel h3 {
    margin: 0 0 20px 0;
    color: #ff9900;
  }

  .form-error {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    color: #ff6666;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .form-success {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 200, 0, 0.2);
    border: 1px solid #00cc00;
    color: #00cc00;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-grid label,
  .notes-label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-grid label span,
  .notes-label span {
    color: #888;
    font-size: 0.9em;
  }

  .form-grid input,
  .notes-label textarea {
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
    border-radius: 8px;
    color: #fff;
    font-size: 1em;
  }

  .form-grid input:focus,
  .notes-label textarea:focus {
    border-color: #ff9900;
    outline: none;
  }

  .notes-label {
    margin-bottom: 20px;
  }

  .notes-label textarea {
    resize: vertical;
    font-family: inherit;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .cancel-btn {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
    border-radius: 8px;
    color: #aaa;
    cursor: pointer;
  }

  .submit-btn {
    padding: 12px 24px;
    background: linear-gradient(180deg, #ff9900 0%, #cc6600 100%);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #888;
  }

  .payouts-table {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    padding: 20px;
    flex: 1;
  }

  .payouts-table h3 {
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

  .amount {
    color: #ff9900;
    font-weight: bold;
  }

  .date {
    color: #888;
    font-size: 0.9em;
  }

  .notes {
    color: #666;
    font-size: 0.9em;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty {
    text-align: center;
    color: #666;
    padding: 20px;
  }

  /* Requests Section */
  .requests-section {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    padding: 20px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
  }

  .section-header h3 {
    margin: 0;
    color: #ffd700;
  }

  .status-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #444;
    border-radius: 6px;
    color: #888;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    color: #fff;
    border-color: #666;
  }

  .filter-btn.active {
    background: #ff9900;
    color: #fff;
    border-color: #ff9900;
  }

  .requests-list {
    display: grid;
    gap: 16px;
  }

  .request-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
    border-radius: 12px;
    padding: 16px;
  }

  .request-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .request-code {
    font-family: monospace;
    color: #ffd700;
    font-size: 1.1em;
    font-weight: bold;
  }

  .request-status {
    font-weight: bold;
    font-size: 0.9em;
    text-transform: uppercase;
  }

  .request-amount {
    font-size: 1.8em;
    font-weight: bold;
    color: #ff9900;
    margin-bottom: 12px;
  }

  .request-player {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .player-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ccc;
  }

  .player-info :global(svg) {
    color: #888;
  }

  .request-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  .game-badge {
    background: #16213e;
    color: #ffd700;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.8em;
    text-transform: uppercase;
  }

  .request-date {
    color: #666;
    font-size: 0.85em;
  }

  .seller-info {
    color: #888;
    font-size: 0.85em;
  }

  .processed-info {
    color: #666;
    font-size: 0.85em;
    margin-bottom: 12px;
    font-style: italic;
  }

  .request-notes {
    color: #888;
    font-size: 0.9em;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    margin-bottom: 12px;
  }

  .request-actions {
    display: flex;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid #333;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.9em;
    transition: all 0.2s;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-btn.approve {
    background: linear-gradient(180deg, #00cc00 0%, #008800 100%);
    color: #fff;
  }

  .action-btn.approve:hover:not(:disabled) {
    background: linear-gradient(180deg, #00dd00 0%, #009900 100%);
  }

  .action-btn.reject {
    background: linear-gradient(180deg, #cc0000 0%, #880000 100%);
    color: #fff;
  }

  .action-btn.reject:hover:not(:disabled) {
    background: linear-gradient(180deg, #dd0000 0%, #990000 100%);
  }

  .action-btn.pay {
    background: linear-gradient(180deg, #ff9900 0%, #cc6600 100%);
    color: #fff;
  }

  .action-btn.pay:hover:not(:disabled) {
    background: linear-gradient(180deg, #ffaa00 0%, #dd7700 100%);
  }

  .player-cell {
    color: #ccc;
  }

  .player-phone {
    color: #888;
    font-size: 0.85em;
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

    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }

    .payouts-table {
      overflow-x: auto;
    }
  }

  @media (min-width: 1200px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }

    .form-panel {
      max-width: 800px;
    }
  }
</style>
