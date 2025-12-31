<script lang="ts">
  import { Wallet, Coins, Trophy, X, LogIn } from 'lucide-svelte';
  import { playerWallet, hasActiveSession, totalBalance } from '$lib/stores/playerWallet';
  import { t } from '$lib/i18n';

  let { onEndSession, onEnterCode }: { onEndSession?: () => void; onEnterCode?: () => void } = $props();

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
    {#if $hasActiveSession}
      <div class="balance-section">
        <div class="balance-item code">
          <Wallet size={16} />
          <span class="label">{$t.navbar.code}:</span>
          <span class="value">{$playerWallet.code}</span>
        </div>

        <div class="balance-item credits">
          <Coins size={16} />
          <span class="label">{$t.navbar.credits}:</span>
          <span class="value">${$playerWallet.credits}</span>
        </div>

        {#if $playerWallet.winnings > 0}
          <div class="balance-item winnings">
            <Trophy size={16} />
            <span class="label">{$t.navbar.winnings}:</span>
            <span class="value">${$playerWallet.winnings.toFixed(2)}</span>
          </div>
        {/if}
      </div>

      <button class="end-session-btn" onclick={handleEndSession} title={$t.navbar.endSession}>
        <X size={18} />
      </button>
    {:else}
      <div class="balance-section">
        <div class="balance-item no-session">
          <Coins size={16} />
          <span class="label">{$t.navbar.noCredits}</span>
        </div>
      </div>

      <button class="enter-code-btn" onclick={handleEnterCode}>
        <LogIn size={16} />
        <span>{$t.navbar.enterCode}</span>
      </button>
    {/if}
  </div>
</nav>

<style>
  .game-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%);
    border-bottom: 2px solid #ffd700;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
    padding: 8px 12px;
    padding-top: max(8px, env(safe-area-inset-top));
  }

  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 800px;
    margin: 0 auto;
    gap: 10px;
  }

  .balance-section {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .balance-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    font-size: 0.85em;
  }

  .balance-item :global(svg) {
    flex-shrink: 0;
  }

  .balance-item.code :global(svg) {
    color: #ffd700;
  }

  .balance-item.credits :global(svg) {
    color: #00bfff;
  }

  .balance-item.winnings :global(svg) {
    color: #00ff00;
  }

  .balance-item .label {
    color: #888;
    font-size: 0.9em;
  }

  .balance-item .value {
    font-weight: bold;
    color: #fff;
  }

  .balance-item.code .value {
    color: #ffd700;
    font-size: 0.85em;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .balance-item.credits .value {
    color: #00bfff;
    text-shadow: 0 0 8px rgba(0, 191, 255, 0.5);
  }

  .balance-item.winnings {
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    animation: pulse 2s ease-in-out infinite;
  }

  .balance-item.winnings .value {
    color: #00ff00;
    text-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .end-session-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 100, 100, 0.2);
    border: 1px solid #ff6666;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .end-session-btn :global(svg) {
    color: #ff6666;
  }

  .end-session-btn:hover {
    background: rgba(255, 100, 100, 0.4);
    transform: scale(1.1);
  }

  .end-session-btn:active {
    transform: scale(0.95);
  }

  .balance-item.no-session {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
  }

  .balance-item.no-session :global(svg) {
    color: #ffd700;
  }

  .balance-item.no-session .label {
    color: #ffd700;
  }

  .enter-code-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 14px;
    background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
    color: #000;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.85em;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .enter-code-btn :global(svg) {
    color: #000;
  }

  .enter-code-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  }

  .enter-code-btn:active {
    transform: scale(0.95);
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .game-navbar {
      padding: 12px 10px;
    }

    .balance-section {
      gap: 8px;
    }

    .balance-item {
      padding: 8px 10px;
      font-size: 0.85em;
    }

    .balance-item .label {
      display: none;
    }

    .balance-item.code .value {
      max-width: 80px;
    }

    .end-session-btn {
      width: 40px;
      height: 40px;
    }

    .end-session-btn :global(svg) {
      width: 20px;
      height: 20px;
    }

    .enter-code-btn {
      padding: 10px 18px;
      font-size: 0.9em;
    }

    .enter-code-btn :global(svg) {
      width: 18px;
      height: 18px;
    }
  }

  /* Very small phones */
  @media (max-width: 350px) {
    .game-navbar {
      padding: 10px 8px;
    }

    .balance-item {
      padding: 6px 8px;
      font-size: 0.8em;
    }

    .balance-item :global(svg) {
      width: 14px;
      height: 14px;
    }

    .balance-item.code .value {
      max-width: 60px;
    }

    .end-session-btn {
      width: 36px;
      height: 36px;
    }

    .enter-code-btn {
      padding: 8px 14px;
    }
  }
</style>
