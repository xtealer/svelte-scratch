<script lang="ts">
  import { Wallet, Coins, Trophy, X, LogIn, Home, UserPlus, PlusCircle, LogOut, User } from 'lucide-svelte';
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
    onProfile,
  }: {
    onEndSession?: () => void;
    onEnterCode?: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    onDeposit?: () => void;
    onProfile?: () => void;
  } = $props();

  // Check if we're on the home page
  let isHomePage = $derived($page.url.pathname === '/');

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
          <div class="balance-section">
            <div class="balance-item code">
              <Wallet size={14} />
              <span class="value">{$playerWallet.code}</span>
            </div>

            <div class="balance-item credits">
              <Coins size={14} />
              <span class="value">${$playerWallet.credits}</span>
            </div>

            {#if $playerWallet.winnings > 0}
              <div class="balance-item winnings">
                <Trophy size={14} />
                <span class="value">${$playerWallet.winnings.toFixed(2)}</span>
              </div>
            {/if}
          </div>

          <button class="end-session-btn" onclick={handleEndSession} title={$t.navbar.endSession}>
            <X size={18} />
          </button>
        {/if}

        <button class="deposit-btn" onclick={handleDeposit} title={$t.navbar.deposit}>
          <PlusCircle size={16} />
          <span class="btn-text">{$t.navbar.deposit}</span>
        </button>

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

  .balance-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .balance-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    font-size: 0.85em;
  }

  .balance-item :global(svg) {
    flex-shrink: 0;
  }

  .balance-item.code :global(svg) {
    color: #ffc107;
  }

  .balance-item.credits :global(svg) {
    color: #00bfff;
  }

  .balance-item.winnings :global(svg) {
    color: #00e701;
  }

  .balance-item .value {
    font-weight: 600;
    color: #fff;
  }

  .balance-item.code .value {
    color: #ffc107;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9em;
  }

  .balance-item.credits .value {
    color: #00bfff;
  }

  .balance-item.winnings {
    background: rgba(0, 231, 1, 0.15);
    border: 1px solid rgba(0, 231, 1, 0.3);
  }

  .balance-item.winnings .value {
    color: #00e701;
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

  .deposit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    background: #00e701;
    color: #0f1923;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.9em;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .deposit-btn:hover {
    background: #00c700;
    transform: scale(1.02);
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

    .balance-section {
      gap: 6px;
    }

    .balance-item {
      padding: 6px 8px;
      font-size: 0.8em;
    }

    .balance-item.code {
      display: none;
    }

    .login-btn,
    .register-btn,
    .deposit-btn {
      padding: 8px 12px;
      font-size: 0.85em;
    }

    .btn-text {
      display: none;
    }

    .deposit-btn {
      padding: 8px 10px;
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

    .balance-item {
      padding: 5px 6px;
      font-size: 0.75em;
    }

    .balance-item :global(svg) {
      width: 12px;
      height: 12px;
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
