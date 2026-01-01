<script lang="ts">
  import {
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle,
    History,
    Dices,
    User,
    Settings,
    LogOut,
    Copy,
    Check
  } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import { playerUser, usdtBalance } from '$lib/stores/playerAuth';

  let {
    show = $bindable(false),
    onDeposit,
    onWithdraw,
    onTransactions,
    onBetHistory,
    onProfile,
    onLogout,
  }: {
    show: boolean;
    onDeposit?: () => void;
    onWithdraw?: () => void;
    onTransactions?: () => void;
    onBetHistory?: () => void;
    onProfile?: () => void;
    onLogout?: () => void;
  } = $props();

  let copied = $state(false);

  // Get display name - prefer fullName, fallback to email or wallet
  let displayName = $derived(() => {
    if ($playerUser?.fullName) return $playerUser.fullName;
    if ($playerUser?.email) return $playerUser.email.split('@')[0];
    if ($playerUser?.metamaskAddress) {
      const addr = $playerUser.metamaskAddress;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return 'User';
  });

  // Get wallet address for display (truncated)
  let walletDisplay = $derived(() => {
    if ($playerUser?.metamaskAddress) {
      const addr = $playerUser.metamaskAddress;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return null;
  });

  function close(): void {
    show = false;
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleMenuItem(action?: () => void): void {
    close();
    action?.();
  }

  async function copyWalletAddress(): Promise<void> {
    if ($playerUser?.metamaskAddress) {
      try {
        await navigator.clipboard.writeText($playerUser.metamaskAddress);
        copied = true;
        setTimeout(() => { copied = false; }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={handleBackdropClick}></div>

  <div class="dropdown-menu">
    <!-- User Info Section -->
    <div class="user-section">
      <div class="user-avatar">
        <div class="avatar-gradient"></div>
      </div>
      <div class="user-info">
        <span class="user-name">{displayName()}</span>
        {#if walletDisplay()}
          <button class="wallet-address" onclick={copyWalletAddress}>
            <span>{walletDisplay()}</span>
            {#if copied}
              <Check size={12} />
            {:else}
              <Copy size={12} />
            {/if}
          </button>
        {/if}
      </div>
    </div>

    <!-- Balance Section -->
    <div class="balance-section">
      <div class="balance-row">
        <div class="balance-label">
          <div class="tether-icon">
            <span>T</span>
          </div>
          <span>{$t.userMenu.balance}</span>
        </div>
        <span class="balance-value">${$usdtBalance.toFixed(2)}</span>
      </div>
    </div>

    <!-- Menu Items -->
    <div class="menu-items">
      <button class="menu-item" onclick={() => handleMenuItem(onDeposit)}>
        <ArrowDownCircle size={20} class="icon deposit" />
        <span>{$t.userMenu.deposit}</span>
      </button>

      <button class="menu-item" onclick={() => handleMenuItem(onWithdraw)}>
        <ArrowUpCircle size={20} class="icon withdraw" />
        <span>{$t.userMenu.withdraw}</span>
      </button>

      <div class="menu-divider"></div>

      <button class="menu-item" onclick={() => handleMenuItem(onTransactions)}>
        <History size={20} class="icon" />
        <span>{$t.userMenu.transactions}</span>
      </button>

      <button class="menu-item" onclick={() => handleMenuItem(onBetHistory)}>
        <Dices size={20} class="icon" />
        <span>{$t.userMenu.betHistory}</span>
      </button>

      <div class="menu-divider"></div>

      <button class="menu-item" onclick={() => handleMenuItem(onProfile)}>
        <User size={20} class="icon" />
        <span>{$t.userMenu.myProfile}</span>
      </button>

      <div class="menu-divider"></div>

      <button class="menu-item logout" onclick={() => handleMenuItem(onLogout)}>
        <LogOut size={20} class="icon" />
        <span>{$t.userMenu.logOut}</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 280px;
    background: #1a2c38;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 1000;
    overflow: hidden;
    animation: slideDown 0.15s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .user-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .avatar-gradient {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%);
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    display: block;
    font-weight: 600;
    color: #fff;
    font-size: 1em;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wallet-address {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #7f8c8d;
    font-size: 0.8em;
    font-family: monospace;
    transition: color 0.2s;
  }

  .wallet-address:hover {
    color: #00bfff;
  }

  .wallet-address :global(svg) {
    flex-shrink: 0;
  }

  .balance-section {
    padding: 12px 16px;
    background: rgba(0, 231, 1, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .balance-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .balance-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #b1bad3;
    font-size: 0.9em;
  }

  .tether-icon {
    width: 20px;
    height: 20px;
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
    font-size: 11px;
    line-height: 1;
  }

  .balance-value {
    font-weight: 700;
    font-size: 1.1em;
    color: #00e701;
  }

  .menu-items {
    padding: 8px 0;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    background: none;
    border: none;
    cursor: pointer;
    color: #b1bad3;
    font-size: 0.95em;
    transition: all 0.15s;
    text-align: left;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .menu-item :global(.icon) {
    flex-shrink: 0;
    color: #7f8c8d;
  }

  .menu-item:hover :global(.icon) {
    color: #00bfff;
  }

  .menu-item :global(.icon.deposit) {
    color: #4ade80;
  }

  .menu-item:hover :global(.icon.deposit) {
    color: #4ade80;
  }

  .menu-item :global(.icon.withdraw) {
    color: #f97316;
  }

  .menu-item:hover :global(.icon.withdraw) {
    color: #f97316;
  }

  .menu-item.logout {
    color: #ff6b6b;
  }

  .menu-item.logout :global(.icon) {
    color: #ff6b6b;
  }

  .menu-item.logout:hover {
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
  }

  .menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin: 4px 0;
  }

  /* Mobile adjustments */
  @media (max-width: 400px) {
    .dropdown-menu {
      width: 260px;
      right: -8px;
    }

    .user-section {
      padding: 12px;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
    }

    .menu-item {
      padding: 10px 14px;
      font-size: 0.9em;
    }
  }
</style>
