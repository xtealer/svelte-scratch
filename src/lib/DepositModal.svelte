<script lang="ts">
  import { Wallet, CreditCard, CircleDollarSign, Copy, Check } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from '$lib/stores/playerAuth';

  let {
    show = $bindable(false),
    onDepositSuccess,
  }: {
    show: boolean;
    onDepositSuccess?: () => void;
  } = $props();

  type DepositMode = 'select' | 'recharge' | 'crypto';
  type Network = 'ethereum' | 'bsc' | 'polygon';

  // State
  let depositMode = $state<DepositMode>('select');
  let code = $state('');
  let loading = $state(false);
  let error = $state('');
  let copied = $state(false);

  // USDT deposit addresses per network (placeholder - would come from API in production)
  const usdtAddresses: Record<Network, string> = {
    ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bE3d',
    bsc: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bE3d',
    polygon: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bE3d'
  };

  const networkNames: Record<Network, string> = {
    ethereum: 'Ethereum',
    bsc: 'BNB Smart Chain',
    polygon: 'Polygon'
  };

  const networkColors: Record<Network, string> = {
    ethereum: '#627eea',
    bsc: '#f3ba2f',
    polygon: '#8247e5'
  };

  let selectedNetwork = $state<Network>('ethereum');

  function close(): void {
    show = false;
    depositMode = 'select';
    code = '';
    error = '';
    copied = false;
    selectedNetwork = 'ethereum';
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  async function handleCodeSubmit(): Promise<void> {
    if (!code.trim()) {
      error = $t.codeModal.enterCodeError;
      return;
    }

    if (!$isPlayerLoggedIn) {
      error = 'Please login first';
      return;
    }

    loading = true;
    error = '';

    try {
      const authState = playerAuth.get();
      if (!authState.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/player/deposit/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || $t.depositModal.invalidCode);
      }

      // Update balance in auth store
      playerAuth.updateBalance(data.newBalance);

      // Call success callback
      if (onDepositSuccess) {
        onDepositSuccess();
      }

      close();
    } catch (e) {
      error = e instanceof Error ? e.message : $t.depositModal.invalidCode;
    } finally {
      loading = false;
    }
  }

  async function copyAddress(): Promise<void> {
    try {
      await navigator.clipboard.writeText(usdtAddresses[selectedNetwork]);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = usdtAddresses[selectedNetwork];
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && depositMode === 'recharge' && !loading) {
      handleCodeSubmit();
    } else if (event.key === 'Escape') {
      if (depositMode !== 'select') {
        depositMode = 'select';
        error = '';
      } else {
        close();
      }
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      {#if depositMode === 'select'}
        <!-- Deposit Method Selection -->
        <div class="modal-header">
          <Wallet size={24} />
          <span>{$t.depositModal.title}</span>
        </div>

        {#if $isPlayerLoggedIn}
          <div class="current-balance">
            <span class="balance-label">{$t.depositModal.currentBalance}</span>
            <span class="balance-value">${$usdtBalance.toFixed(2)}</span>
          </div>
        {/if}

        <div class="deposit-options">
          <button
            class="option-btn recharge"
            onclick={() => depositMode = 'recharge'}
          >
            <CreditCard size={24} />
            <div class="option-text">
              <span class="option-title">{$t.depositModal.rechargeCard}</span>
              <span class="option-desc">{$t.depositModal.rechargeDesc}</span>
            </div>
          </button>

          <button
            class="option-btn crypto"
            onclick={() => depositMode = 'crypto'}
          >
            <CircleDollarSign size={24} />
            <div class="option-text">
              <span class="option-title">Deposit USDT</span>
              <span class="option-desc">Ethereum, BSC, Polygon</span>
            </div>
          </button>
        </div>

        <button class="cancel-btn" onclick={close}>
          {$t.depositModal.cancel}
        </button>

      {:else if depositMode === 'recharge'}
        <!-- Recharge Code Entry -->
        <div class="modal-header">
          <CreditCard size={24} />
          <span>{$t.depositModal.rechargeCard}</span>
        </div>

        <div class="form-group">
          <input
            type="text"
            bind:value={code}
            placeholder={$t.codeModal.placeholder}
            onkeydown={handleKeydown}
            disabled={loading}
            maxlength="20"
            class="code-input"
          />
        </div>

        <div class="info">
          <p>{$t.codeModal.info1}</p>
        </div>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="buttons">
          <button class="submit-btn" onclick={handleCodeSubmit} disabled={loading}>
            {loading ? $t.codeModal.loading : $t.codeModal.loadPlays}
          </button>
          <button class="cancel-btn" onclick={() => { depositMode = 'select'; error = ''; }}>
            {$t.authModal.back}
          </button>
        </div>

      {:else if depositMode === 'crypto'}
        <!-- USDT Deposit -->
        <div class="modal-header">
          <CircleDollarSign size={24} />
          <span>Deposit USDT</span>
        </div>

        <div class="usdt-badge">
          <span class="usdt-icon">₮</span>
          <span>Tether USDT</span>
        </div>

        <div class="network-label">Select Network</div>
        <div class="network-tabs">
          <button
            class="network-tab"
            class:active={selectedNetwork === 'ethereum'}
            onclick={() => selectedNetwork = 'ethereum'}
            style="--network-color: {networkColors.ethereum}"
          >
            <span class="network-icon">Ξ</span>
            <span>Ethereum</span>
          </button>
          <button
            class="network-tab"
            class:active={selectedNetwork === 'bsc'}
            onclick={() => selectedNetwork = 'bsc'}
            style="--network-color: {networkColors.bsc}"
          >
            <span class="network-icon">⬡</span>
            <span>BSC</span>
          </button>
          <button
            class="network-tab"
            class:active={selectedNetwork === 'polygon'}
            onclick={() => selectedNetwork = 'polygon'}
            style="--network-color: {networkColors.polygon}"
          >
            <span class="network-icon">⬡</span>
            <span>Polygon</span>
          </button>
        </div>

        <div class="crypto-address">
          <span class="address-label">Send USDT ({networkNames[selectedNetwork]}) to:</span>
          <div class="address-box">
            <span class="address">{usdtAddresses[selectedNetwork]}</span>
            <button class="copy-btn" onclick={copyAddress}>
              {#if copied}
                <Check size={18} />
              {:else}
                <Copy size={18} />
              {/if}
            </button>
          </div>
        </div>

        <div class="crypto-info">
          <p>Your balance will be updated after network confirmation.</p>
          <p class="warning">Only send USDT on the {networkNames[selectedNetwork]} network to this address!</p>
        </div>

        <div class="buttons">
          <button class="cancel-btn" onclick={() => depositMode = 'select'}>
            {$t.authModal.back}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    z-index: 1100;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px;
    padding-top: max(12px, env(safe-area-inset-top));
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }

  .modal-content {
    background: linear-gradient(#1a2c38, #213743);
    border: 3px solid #00e701;
    border-radius: 16px;
    padding: 20px 16px;
    width: 100%;
    max-width: 400px;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    box-shadow: 0 0 30px rgba(0, 231, 1, 0.3);
  }

  .modal-header {
    font-size: 1.3em;
    margin-bottom: 20px;
    text-shadow: 0 0 10px rgba(0, 231, 1, 0.5);
    color: #00e701;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .current-balance {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(0, 231, 1, 0.1);
    border: 1px solid rgba(0, 231, 1, 0.3);
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .balance-label {
    color: #b1bad3;
    font-size: 0.9em;
  }

  .balance-value {
    color: #00e701;
    font-size: 1.2em;
    font-weight: bold;
  }

  .deposit-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .option-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #2d4a5e;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .option-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #00e701;
  }

  .option-btn.recharge :global(svg) {
    color: #ffc107;
    flex-shrink: 0;
  }

  .option-btn.crypto :global(svg) {
    color: #26a17b;
    flex-shrink: 0;
  }

  .option-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .option-title {
    color: #fff;
    font-size: 1.1em;
    font-weight: 600;
  }

  .option-desc {
    color: #888;
    font-size: 0.85em;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .code-input {
    width: 100%;
    padding: 14px 12px;
    font-size: 1.1em;
    text-align: center;
    text-transform: uppercase;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    color: #00e701;
    letter-spacing: 2px;
  }

  .code-input:focus {
    outline: none;
    border-color: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.3);
  }

  .code-input::placeholder {
    color: #666;
    letter-spacing: 0;
    text-transform: none;
    font-size: 0.9em;
  }

  .info {
    text-align: center;
    color: #aaa;
    margin-bottom: 16px;
    font-size: 0.85em;
    line-height: 1.4;
  }

  .info p {
    margin: 4px 0;
  }

  .usdt-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba(38, 161, 123, 0.15);
    border: 1px solid rgba(38, 161, 123, 0.3);
    border-radius: 10px;
    margin-bottom: 20px;
    color: #26a17b;
    font-weight: 600;
  }

  .usdt-icon {
    font-size: 1.4em;
    font-weight: bold;
  }

  .network-label {
    color: #b1bad3;
    font-size: 0.9em;
    margin-bottom: 10px;
    text-align: center;
  }

  .network-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }

  .network-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    color: #888;
    font-weight: 600;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .network-tab:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .network-tab.active {
    background: rgba(var(--network-color-rgb, 98, 126, 234), 0.2);
    border-color: var(--network-color, #627eea);
    color: var(--network-color, #627eea);
  }

  .network-icon {
    font-size: 1.3em;
  }

  .crypto-address {
    margin-bottom: 20px;
  }

  .address-label {
    display: block;
    color: #b1bad3;
    font-size: 0.9em;
    margin-bottom: 8px;
  }

  .address-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
  }

  .address {
    flex: 1;
    color: #fff;
    font-family: monospace;
    font-size: 0.85em;
    word-break: break-all;
  }

  .copy-btn {
    flex-shrink: 0;
    padding: 8px;
    background: rgba(0, 231, 1, 0.2);
    border: none;
    border-radius: 6px;
    color: #00e701;
    cursor: pointer;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    background: rgba(0, 231, 1, 0.3);
  }

  .crypto-info {
    text-align: center;
    font-size: 0.85em;
    margin-bottom: 20px;
  }

  .crypto-info p {
    color: #b1bad3;
    margin: 8px 0;
  }

  .crypto-info .warning {
    color: #ffa500;
  }

  .error {
    color: #ff4444;
    text-align: center;
    margin-bottom: 16px;
    font-size: 0.9em;
    padding: 10px;
    background: rgba(255, 68, 68, 0.1);
    border-radius: 8px;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .submit-btn {
    padding: 14px;
    font-size: 1.1em;
    width: 100%;
    background: linear-gradient(#00e701, #00b301);
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    transform: scale(1.02);
  }

  .submit-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cancel-btn {
    padding: 12px;
    font-size: 1em;
    width: 100%;
    background: linear-gradient(#2d4a5e, #1a2c38);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 24px 20px;
    }
  }
</style>
