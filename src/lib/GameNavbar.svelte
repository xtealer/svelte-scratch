<script lang="ts">
  import { X, LogIn, Home, UserPlus, LogOut, User } from 'lucide-svelte';
  import { playerWallet, hasActiveSession } from '$lib/stores/playerWallet';
  import { playerAuth, isPlayerLoggedIn, playerUser } from '$lib/stores/playerAuth';
  import { t } from '$lib/i18n';
  import { page } from '$app/stores';

  let {
    onEndSession,
    onEnterCode,
    onLogin,
    onRegister,
    onDeposit,
    onWithdraw,
    onProfile,
  }: {
    onEndSession?: () => void;
    onEnterCode?: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    onDeposit?: () => void;
    onWithdraw?: () => void;
    onProfile?: () => void;
  } = $props();

  // Check if we're on the home page
  let isHomePage = $derived($page.url.pathname === '/');

  // Balance combines recharge card credits + winnings + any USDT balance
  let totalUsdtBalance = $derived(
    ($playerWallet.credits || 0) +
    ($playerWallet.winnings || 0) +
    ($playerUser?.usdtBalance ?? 0)
  );

  function handleEndSession() {
    if (confirm($t.navbar.confirmEndSession)) {
      playerWallet.clear();
      if (onEndSession) {
        onEndSession();
      }
    }
  }

  function handleEnterCode() {
    if (onEnterCode) {
      onEnterCode();
    }
  }

  function handleLogin() {
    if (onLogin) {
      onLogin();
    }
  }

  function handleRegister() {
    if (onRegister) {
      onRegister();
    }
  }

  function handleDeposit() {
    if (onDeposit) {
      onDeposit();
    }
  }

  function handleWithdraw() {
    if (onWithdraw) {
      onWithdraw();
    }
  }

  function handleProfile() {
    if (onProfile) {
      onProfile();
    }
  }

  function handleLogout() {
    if (confirm($t.navbar.confirmLogout)) {
      playerAuth.logout();
      playerWallet.clear();
    }
  }
</script>

<nav class="game-navbar">
  <div class="navbar-content">
    <!-- Left side: Logo/Home -->
    <div class="navbar-left">
      {#if !isHomePage}
        <a href="/" class="home-link" title="Home">
          <Home size={20} />
        </a>
      {/if}
      <a href="/" class="logo">
        <span class="logo-text">Gold</span>
        <span class="logo-accent">Games</span>
      </a>
    </div>

    <!-- Right side: Auth buttons or balance info -->
    <div class="navbar-right">
      {#if $isPlayerLoggedIn}
        <!-- Logged in state -->
        {#if $hasActiveSession}
          <button class="end-session-btn" onclick={handleEndSession} title={$t.navbar.endSession}>
            <X size={18} />
          </button>
        {/if}

        <div class="balance-group">
          <button class="withdraw-btn" onclick={handleWithdraw} title={$t.navbar.withdraw}>
            {$t.navbar.withdraw}
          </button>
          <div class="usdt-balance">
            <div class="tether-icon">
              <span>T</span>
            </div>
            <span class="balance-amount">${totalUsdtBalance.toFixed(2)}</span>
          </div>
          <button class="deposit-btn" onclick={handleDeposit} title={$t.navbar.deposit}>
            {$t.navbar.deposit}
          </button>
        </div>

        <div class="user-menu">
          <button class="user-btn" onclick={handleProfile} title={$playerUser?.fullName}>
            <User size={16} />
          </button>
          <button class="logout-btn" onclick={handleLogout} title={$t.navbar.logout}>
            <LogOut size={16} />
          </button>
        </div>
      {:else}
        <!-- Not logged in state -->
        <button class="login-btn" onclick={handleLogin}>
          <LogIn size={16} />
          <span>{$t.navbar.login}</span>
        </button>

        <button class="register-btn" onclick={handleRegister}>
          <UserPlus size={16} />
          <span>{$t.navbar.register}</span>
        </button>
      {/if}
    </div>
  </div>
</nav>

<style>
  .game-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: #1a2c38;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    padding: 10px 16px;
    padding-top: max(10px, env(safe-area-inset-top));
  }

  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    gap: 12px;
  }

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .home-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    color: #b1bad3;
    transition: all 0.2s;
  }

  .home-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .logo {
    text-decoration: none;
    font-size: 1.3em;
    font-weight: 700;
    display: flex;
    gap: 4px;
  }

  .logo-text {
    color: #fff;
  }

  .logo-accent {
    color: #00e701;
  }

  .navbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .end-session-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(237, 99, 0, 0.2);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .end-session-btn :global(svg) {
    color: #ed6300;
  }

  .end-session-btn:hover {
    background: rgba(237, 99, 0, 0.4);
  }

  .end-session-btn:active {
    transform: scale(0.95);
  }

  .login-btn,
  .register-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9em;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .login-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .login-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .register-btn {
    background: #00e701;
    color: #0f1923;
  }

  .register-btn:hover {
    background: #00c700;
    transform: scale(1.02);
  }

  .register-btn:active,
  .login-btn:active {
    transform: scale(0.98);
  }

  .balance-group {
    display: flex;
    align-items: center;
    background: #2d3d4a;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .usdt-balance {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
  }

  .withdraw-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    height: 100%;
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: #fff;
    border: none;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.9em;
    transition: all 0.2s;
  }

  .withdraw-btn:hover {
    background: linear-gradient(135deg, #ea580c, #c2410c);
  }

  .withdraw-btn:active {
    transform: scale(0.98);
  }

  .tether-icon {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #26a17b, #1a8a6a);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tether-icon span {
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    line-height: 1;
  }

  .balance-amount {
    color: #fff;
    font-weight: 600;
    font-size: 0.95em;
    white-space: nowrap;
  }

  .deposit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    height: 100%;
    background: linear-gradient(135deg, #4ade80, #22c55e);
    color: #0f1923;
    border: none;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.9em;
    transition: all 0.2s;
  }

  .deposit-btn:hover {
    background: linear-gradient(135deg, #22c55e, #16a34a);
  }

  .deposit-btn:active {
    transform: scale(0.98);
  }

  .user-menu {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .user-btn,
  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .user-btn :global(svg) {
    color: #00bfff;
  }

  .logout-btn :global(svg) {
    color: #ff6b6b;
  }

  .user-btn:hover,
  .logout-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Mobile adjustments */
  @media (max-width: 600px) {
    .game-navbar {
      padding: 8px 12px;
    }

    .logo {
      font-size: 1.1em;
    }

    .login-btn,
    .register-btn {
      padding: 8px 12px;
      font-size: 0.85em;
    }

    .balance-group {
      border-radius: 6px;
    }

    .usdt-balance {
      padding: 6px 8px;
      gap: 6px;
    }

    .tether-icon {
      width: 20px;
      height: 20px;
    }

    .tether-icon span {
      font-size: 12px;
    }

    .balance-amount {
      font-size: 0.85em;
    }

    .deposit-btn,
    .withdraw-btn {
      padding: 6px 10px;
      font-size: 0.8em;
    }

    .user-btn,
    .logout-btn,
    .end-session-btn {
      width: 34px;
      height: 34px;
    }
  }

  /* Very small phones */
  @media (max-width: 400px) {
    .game-navbar {
      padding: 6px 8px;
    }

    .logo {
      font-size: 1em;
    }

    .login-btn span,
    .register-btn span {
      display: none;
    }

    .login-btn,
    .register-btn {
      padding: 8px;
    }
  }
</style>
