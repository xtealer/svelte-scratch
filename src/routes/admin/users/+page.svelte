<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    Users,
    UserPlus,
    Edit,
    ToggleLeft,
    ToggleRight,
    ArrowLeft,
    X,
    Check,
    BarChart3,
    TrendingUp,
    DollarSign,
    ShoppingCart
  } from 'lucide-svelte';

  type UserRole = 'super' | 'admin' | 'seller';

  interface User {
    _id: string;
    username: string;
    name: string;
    role: UserRole;
    active: boolean;
    createdAt: string;
    lastLogin?: string;
  }

  interface CurrentUser {
    userId: string;
    role: UserRole;
  }

  interface UserStats {
    totalSales: number;
    totalRevenue: number;
    todaySales: number;
    todayRevenue: number;
    monthSales: number;
    monthRevenue: number;
  }

  let currentUser = $state<CurrentUser | null>(null);
  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state('');

  // New user form
  let showNewForm = $state(false);
  let newUsername = $state('');
  let newPassword = $state('');
  let newName = $state('');
  let newRole = $state<'admin' | 'seller'>('seller');
  let formError = $state('');
  let formLoading = $state(false);

  // Edit user
  let editingUser = $state<User | null>(null);
  let editName = $state('');
  let editRole = $state<UserRole>('seller');
  let editPassword = $state('');

  // User stats modal
  let showStatsUser = $state<User | null>(null);
  let userStats = $state<UserStats | null>(null);
  let statsLoading = $state(false);

  // Check if current user can create admin users
  let canCreateAdmin = $derived(currentUser?.role === 'super');

  onMount(async () => {
    await checkAuth();
    await loadUsers();
  });

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      // Allow super and admin
      if (!data.authenticated || (data.user.role !== 'admin' && data.user.role !== 'super')) {
        goto('/admin');
        return;
      }
      currentUser = data.user;
    } catch {
      goto('/admin');
    }
  }

  async function loadUsers() {
    loading = true;
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        users = data.users;
      }
    } catch {
      error = 'Failed to load users';
    }
    loading = false;
  }

  async function createUser(e: Event) {
    e.preventDefault();
    formError = '';
    formLoading = true;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole
        })
      });

      const data = await res.json();

      if (!res.ok) {
        formError = data.error || 'Failed to create user';
        formLoading = false;
        return;
      }

      // Reset form and reload
      showNewForm = false;
      newUsername = '';
      newPassword = '';
      newName = '';
      newRole = 'seller';
      await loadUsers();
    } catch {
      formError = 'Connection error';
    }
    formLoading = false;
  }

  function startEdit(user: User) {
    editingUser = user;
    editName = user.name;
    editRole = user.role;
    editPassword = '';
  }

  function cancelEdit() {
    editingUser = null;
  }

  async function saveEdit() {
    if (!editingUser) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser._id,
          name: editName,
          role: editRole,
          newPassword: editPassword || undefined
        })
      });

      if (res.ok) {
        editingUser = null;
        await loadUsers();
      }
    } catch {
      // Handle error
    }
  }

  async function toggleActive(user: User) {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          active: !user.active
        })
      });
      await loadUsers();
    } catch {
      // Handle error
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  }

  async function viewUserStats(user: User) {
    showStatsUser = user;
    userStats = null;
    statsLoading = true;

    try {
      const res = await fetch(`/api/admin/sales?sellerId=${user._id}`);
      if (res.ok) {
        const data = await res.json();
        userStats = data.stats;
      }
    } catch {
      // Handle error
    }
    statsLoading = false;
  }

  function closeStats() {
    showStatsUser = null;
    userStats = null;
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
        <Users size={28} />
        <span>User Management</span>
      </h1>
      <button class="add-btn" onclick={() => showNewForm = true}>
        <UserPlus size={20} />
        <span>Add User</span>
      </button>
    </header>

    {#if showNewForm}
      <div class="form-card">
        <h3>Create New User</h3>
        <form onsubmit={createUser}>
          {#if formError}
            <div class="form-error">{formError}</div>
          {/if}

          <div class="form-row">
            <label>
              <span>Username</span>
              <input type="text" bind:value={newUsername} required />
            </label>
            <label>
              <span>Password</span>
              <input type="password" bind:value={newPassword} required />
            </label>
          </div>

          <div class="form-row">
            <label>
              <span>Full Name</span>
              <input type="text" bind:value={newName} required />
            </label>
            <label>
              <span>Role</span>
              <select bind:value={newRole}>
                <option value="seller">Seller</option>
                {#if canCreateAdmin}
                  <option value="admin">Admin</option>
                {/if}
              </select>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" onclick={() => showNewForm = false}>
              Cancel
            </button>
            <button type="submit" class="submit-btn" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    {/if}

    {#if loading}
      <div class="loading">Loading users...</div>
    {:else if error}
      <div class="error-msg">{error}</div>
    {:else}
      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each users as user}
              <tr class:inactive={!user.active}>
                <td class="username">{user.username}</td>
                <td>
                  {#if editingUser?._id === user._id}
                    <input type="text" bind:value={editName} class="inline-input" />
                  {:else}
                    {user.name}
                  {/if}
                </td>
                <td>
                  {#if editingUser?._id === user._id && user.role !== 'super'}
                    <select bind:value={editRole} class="inline-select">
                      <option value="seller">Seller</option>
                      {#if canCreateAdmin}
                        <option value="admin">Admin</option>
                      {/if}
                    </select>
                  {:else}
                    <span class="role-badge" class:admin={user.role === 'admin'} class:super={user.role === 'super'}>
                      {user.role}
                    </span>
                  {/if}
                </td>
                <td>
                  <button
                    class="toggle-btn"
                    class:active={user.active}
                    onclick={() => toggleActive(user)}
                  >
                    {#if user.active}
                      <ToggleRight size={20} />
                      <span>Active</span>
                    {:else}
                      <ToggleLeft size={20} />
                      <span>Inactive</span>
                    {/if}
                  </button>
                </td>
                <td class="date">{formatDate(user.lastLogin)}</td>
                <td class="actions">
                  {#if editingUser?._id === user._id}
                    <input
                      type="password"
                      bind:value={editPassword}
                      placeholder="New password (optional)"
                      class="password-input"
                    />
                    <button class="icon-btn save" onclick={saveEdit}>
                      <Check size={18} />
                    </button>
                    <button class="icon-btn cancel" onclick={cancelEdit}>
                      <X size={18} />
                    </button>
                  {:else}
                    <button class="icon-btn stats" onclick={() => viewUserStats(user)} title="View Stats">
                      <BarChart3 size={18} />
                    </button>
                    <button class="icon-btn" onclick={() => startEdit(user)} title="Edit">
                      <Edit size={18} />
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </main>
</div>

{#if showStatsUser}
  <div class="modal-overlay" onclick={closeStats}>
    <div class="stats-modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3>
          <BarChart3 size={24} />
          <span>Stats for {showStatsUser.name}</span>
        </h3>
        <button class="close-btn" onclick={closeStats}>
          <X size={20} />
        </button>
      </div>

      {#if statsLoading}
        <div class="modal-loading">Loading stats...</div>
      {:else if userStats}
        <div class="stats-grid">
          <div class="stat-item">
            <DollarSign size={20} />
            <div class="stat-content">
              <span class="stat-label">Total Revenue</span>
              <span class="stat-value">${userStats.totalRevenue.toFixed(2)}</span>
            </div>
          </div>
          <div class="stat-item">
            <ShoppingCart size={20} />
            <div class="stat-content">
              <span class="stat-label">Total Sales</span>
              <span class="stat-value">{userStats.totalSales}</span>
            </div>
          </div>
          <div class="stat-item today">
            <TrendingUp size={20} />
            <div class="stat-content">
              <span class="stat-label">Today</span>
              <span class="stat-value">{userStats.todaySales} sales (${userStats.todayRevenue.toFixed(2)})</span>
            </div>
          </div>
          <div class="stat-item month">
            <TrendingUp size={20} />
            <div class="stat-content">
              <span class="stat-label">This Month</span>
              <span class="stat-value">{userStats.monthSales} sales (${userStats.monthRevenue.toFixed(2)})</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <a href="/admin/sales?sellerId={showStatsUser._id}" class="view-sales-btn">
            View All Sales
          </a>
        </div>
      {:else}
        <div class="modal-empty">No stats available</div>
      {/if}
    </div>
  </div>
{/if}

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
    transition: all 0.2s;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
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
    background: linear-gradient(180deg, #00cc00 0%, #008800 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
  }

  .add-btn:hover {
    transform: scale(1.02);
  }

  .form-card {
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid #333;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .form-card h3 {
    margin: 0 0 20px 0;
    color: #ffd700;
  }

  .form-error {
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    color: #ff6666;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-row label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-row label span {
    color: #888;
    font-size: 0.9em;
  }

  .form-row input,
  .form-row select {
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
    border-radius: 8px;
    color: #fff;
    font-size: 1em;
  }

  .form-row input:focus,
  .form-row select:focus {
    border-color: #ffd700;
    outline: none;
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
    background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
    border: none;
    border-radius: 8px;
    color: #000;
    font-weight: bold;
    cursor: pointer;
  }

  .submit-btn:disabled {
    opacity: 0.7;
  }

  .loading, .error-msg {
    text-align: center;
    padding: 40px;
    color: #888;
  }

  .error-msg {
    color: #ff6666;
  }

  .users-table {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    overflow: hidden;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    text-align: left;
    padding: 14px 16px;
    border-bottom: 1px solid #333;
  }

  th {
    background: rgba(0, 0, 0, 0.3);
    color: #888;
    font-size: 0.85em;
    font-weight: normal;
  }

  td {
    color: #fff;
  }

  tr.inactive td {
    opacity: 0.5;
  }

  .username {
    font-family: monospace;
    color: #ffd700;
  }

  .role-badge {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(100, 100, 255, 0.2);
    border: 1px solid #6666ff;
    border-radius: 12px;
    color: #8888ff;
    font-size: 0.8em;
    text-transform: uppercase;
  }

  .role-badge.admin {
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    color: #ffd700;
  }

  .role-badge.super {
    background: rgba(255, 0, 150, 0.2);
    border-color: #ff0096;
    color: #ff0096;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    border-radius: 16px;
    color: #ff6666;
    cursor: pointer;
    font-size: 0.85em;
  }

  .toggle-btn.active {
    background: rgba(0, 200, 0, 0.2);
    border-color: #00cc00;
    color: #00cc00;
  }

  .date {
    color: #888;
    font-size: 0.9em;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
    border-radius: 6px;
    color: #aaa;
    cursor: pointer;
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .icon-btn.save {
    background: rgba(0, 200, 0, 0.2);
    border-color: #00cc00;
    color: #00cc00;
  }

  .icon-btn.cancel {
    background: rgba(255, 0, 0, 0.2);
    border-color: #ff4444;
    color: #ff6666;
  }

  .icon-btn.stats {
    background: rgba(0, 150, 255, 0.2);
    border-color: #0096ff;
    color: #0096ff;
  }

  .icon-btn.stats:hover {
    background: rgba(0, 150, 255, 0.3);
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .stats-modal {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border: 2px solid #ffd700;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    padding: 24px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .modal-header h3 {
    margin: 0;
    color: #ffd700;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .close-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px;
  }

  .close-btn:hover {
    color: #fff;
  }

  .modal-loading, .modal-empty {
    text-align: center;
    color: #888;
    padding: 40px;
  }

  .stats-modal .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    border: 1px solid #333;
  }

  .stat-item :global(svg) {
    color: #00cc00;
    flex-shrink: 0;
  }

  .stat-item.today :global(svg) {
    color: #0096ff;
  }

  .stat-item.month :global(svg) {
    color: #ffd700;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
  }

  .stat-label {
    color: #888;
    font-size: 0.8em;
  }

  .stat-value {
    color: #fff;
    font-weight: bold;
    font-size: 1.1em;
  }

  .modal-actions {
    text-align: center;
  }

  .view-sales-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
    color: #000;
    text-decoration: none;
    border-radius: 8px;
    font-weight: bold;
    transition: transform 0.1s;
  }

  .view-sales-btn:hover {
    transform: scale(1.02);
  }

  .inline-input,
  .inline-select,
  .password-input {
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #ffd700;
    border-radius: 6px;
    color: #fff;
    font-size: 0.9em;
  }

  .password-input {
    width: 140px;
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

    .users-table {
      overflow-x: auto;
    }

    .actions {
      flex-wrap: wrap;
    }

    .password-input {
      width: 100px;
    }
  }

  @media (min-width: 1400px) {
    .users-table table {
      table-layout: fixed;
    }

    .users-table th:first-child,
    .users-table td:first-child {
      width: 15%;
    }

    .users-table th:nth-child(2),
    .users-table td:nth-child(2) {
      width: 20%;
    }

    .users-table th:nth-child(3),
    .users-table td:nth-child(3) {
      width: 10%;
    }

    .users-table th:nth-child(4),
    .users-table td:nth-child(4) {
      width: 12%;
    }

    .users-table th:nth-child(5),
    .users-table td:nth-child(5) {
      width: 18%;
    }

    .users-table th:last-child,
    .users-table td:last-child {
      width: 25%;
    }
  }
</style>
