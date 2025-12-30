<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    Receipt,
    ArrowLeft,
    Plus,
    DollarSign,
    Wallet,
    Calendar,
    AlertCircle,
    Check
  } from 'lucide-svelte';

  interface Payout {
    _id: string;
    code: string;
    amount: number;
    paidByName: string;
    paidAt: string;
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

  let payouts = $state<Payout[]>([]);
  let stats = $state<Stats | null>(null);
  let loading = $state(true);
  let isAdmin = $state(false);

  // New payout form
  let showForm = $state(false);
  let payoutCode = $state('');
  let payoutAmount = $state<number | null>(null);
  let payoutNotes = $state('');
  let formError = $state('');
  let formSuccess = $state('');
  let submitting = $state(false);

  onMount(async () => {
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
      isAdmin = data.user.role === 'admin';
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
        payouts = data.payouts;
        stats = data.stats;
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
        <Receipt size={28} />
        <span>Payouts</span>
      </h1>
      <button class="add-btn" onclick={() => showForm = true}>
        <Plus size={20} />
        <span>Register Payout</span>
      </button>
    </header>

    {#if stats}
      <div class="stats-grid">
        <div class="stat-card">
          <Wallet size={24} />
          <div class="stat-info">
            <span class="label">Total Paid Out</span>
            <span class="value">${stats.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div class="stat-card">
          <DollarSign size={24} />
          <div class="stat-info">
            <span class="label">Total Payouts</span>
            <span class="value">{stats.totalPayouts}</span>
          </div>
        </div>
        <div class="stat-card today">
          <Calendar size={24} />
          <div class="stat-info">
            <span class="label">Today</span>
            <span class="value">{stats.todayPayouts} - ${stats.todayAmount.toFixed(2)}</span>
          </div>
        </div>
        <div class="stat-card month">
          <Calendar size={24} />
          <div class="stat-info">
            <span class="label">This Month</span>
            <span class="value">{stats.monthPayouts} - ${stats.monthAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    {/if}

    {#if showForm}
      <div class="form-panel">
        <h3>Register Prize Payment</h3>

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
              <span>Code</span>
              <input
                type="text"
                bind:value={payoutCode}
                onblur={checkCode}
                placeholder="GOLD-001-000000001"
                required
              />
            </label>
            <label>
              <span>Amount ($)</span>
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
            <span>Notes (optional)</span>
            <textarea
              bind:value={payoutNotes}
              placeholder="Any additional notes about this payout..."
              rows="2"
            ></textarea>
          </label>

          <div class="form-actions">
            <button type="button" class="cancel-btn" onclick={() => showForm = false}>
              Cancel
            </button>
            <button type="submit" class="submit-btn" disabled={submitting}>
              {submitting ? 'Processing...' : 'Register Payout'}
            </button>
          </div>
        </form>
      </div>
    {/if}

    {#if loading}
      <div class="loading">Loading payouts...</div>
    {:else}
      <div class="payouts-table">
        <h3>Recent Payouts</h3>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Amount</th>
              {#if isAdmin}
                <th>Paid By</th>
              {/if}
              <th>Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {#each payouts as payout}
              <tr>
                <td class="code">{payout.code}</td>
                <td class="amount">${payout.amount.toFixed(2)}</td>
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
          <p class="empty">No payouts registered yet</p>
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

  @media (max-width: 768px) {
    .admin-container {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
    }

    .payouts-table {
      overflow-x: auto;
    }
  }
</style>
