<script lang="ts">
  import { Wallet, Coins, Trophy, X, LogIn, Home } from 'lucide-svelte';
  import { playerWallet, hasActiveSession } from '$lib/stores/playerWallet';
  import { t } from '$lib/i18n';
  import { page } from '$app/stores';

  let { onEndSession, onEnterCode }: { onEndSession?: () => void; onEnterCode?: () => void } = $props();

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

    <!-- Right side: Balance info or Enter Code -->
    <div class="navbar-right">
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
      {:else}
        <button class="enter-code-btn" onclick={handleEnterCode}>
          <LogIn size={16} />
          <span>{$t.navbar.enterCode}</span>
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
    gap: 12px;
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

  .enter-code-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
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

  .enter-code-btn :global(svg) {
    color: #0f1923;
  }

  .enter-code-btn:hover {
    background: #00c700;
    transform: scale(1.02);
  }

  .enter-code-btn:active {
    transform: scale(0.98);
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
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

    .end-session-btn {
      width: 34px;
      height: 34px;
    }

    .enter-code-btn {
      padding: 8px 16px;
      font-size: 0.85em;
    }
  }

  /* Very small phones */
  @media (max-width: 350px) {
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

    .enter-code-btn {
      padding: 6px 12px;
      font-size: 0.8em;
    }

    .enter-code-btn :global(svg) {
      width: 14px;
      height: 14px;
    }
  }
</style>
