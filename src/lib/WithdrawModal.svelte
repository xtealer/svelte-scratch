<script lang="ts">
  import { ArrowUpFromLine, Wallet } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import { playerUser } from '$lib/stores/playerAuth';
  import { playerWallet } from '$lib/stores/playerWallet';

  let {
    show = $bindable(false),
    onWithdrawSubmit,
  }: {
    show: boolean;
    onWithdrawSubmit?: (amount: number, address: string) => Promise<void>;
  } = $props();

  // State
  let amount = $state('');
  let walletAddress = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);

  // Calculate available balance
  let availableBalance = $derived(
    ($playerWallet.credits || 0) +
    ($playerWallet.winnings || 0) +
    ($playerUser?.usdtBalance ?? 0)
  );

  function close(): void {
    show = false;
    amount = '';
    walletAddress = '';
    error = '';
    success = false;
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function setMaxAmount(): void {
    amount = availableBalance.toFixed(2);
  }

  async function handleSubmit(): Promise<void> {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      error = $t.withdrawModal.amountError;
      return;
    }

    if (numAmount > availableBalance) {
      error = $t.withdrawModal.insufficientBalance;
      return;
    }

    if (!walletAddress.trim()) {
      error = $t.withdrawModal.addressError;
      return;
    }

    // Basic wallet address validation (starts with 0x and has 42 chars for EVM)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      error = $t.withdrawModal.invalidAddress;
      return;
    }

    loading = true;
    error = '';

    try {
      if (onWithdrawSubmit) {
        await onWithdrawSubmit(numAmount, walletAddress.trim());
      }
      success = true;
    } catch (e) {
      error = e instanceof Error ? e.message : $t.withdrawModal.requestError;
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !loading && !success) {
      handleSubmit();
    } else if (event.key === 'Escape') {
      close();
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      {#if success}
        <!-- Success State -->
        <div class="modal-header success">
          <ArrowUpFromLine size={24} />
          <span>{$t.withdrawModal.requestSent}</span>
        </div>

        <div class="success-info">
          <div class="amount-display">
            <span class="label">{$t.withdrawModal.amountRequested}</span>
            <span class="value">${parseFloat(amount).toFixed(2)}</span>
          </div>
          <p>{$t.withdrawModal.successInfo1}</p>
          <p>{$t.withdrawModal.successInfo2}</p>
        </div>

        <button class="submit-btn" onclick={close}>
          {$t.withdrawModal.close}
        </button>
      {:else}
        <!-- Withdraw Form -->
        <div class="modal-header">
          <ArrowUpFromLine size={24} />
          <span>{$t.withdrawModal.title}</span>
        </div>

        <div class="balance-display">
          <Wallet size={18} />
          <span class="label">{$t.withdrawModal.availableBalance}</span>
          <span class="value">${availableBalance.toFixed(2)}</span>
        </div>

        <div class="form-group">
          <label for="amount">{$t.withdrawModal.amount}</label>
          <div class="amount-input-group">
            <span class="currency">$</span>
            <input
              id="amount"
              type="number"
              bind:value={amount}
              placeholder="0.00"
              onkeydown={handleKeydown}
              disabled={loading}
              min="0"
              max={availableBalance}
              step="0.01"
              class="amount-input"
            />
            <button class="max-btn" onclick={setMaxAmount} disabled={loading}>
              MAX
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="address">{$t.withdrawModal.walletAddress}</label>
          <input
            id="address"
            type="text"
            bind:value={walletAddress}
            placeholder={$t.withdrawModal.addressPlaceholder}
            onkeydown={handleKeydown}
            disabled={loading}
            class="address-input"
          />
        </div>

        <div class="info">
          <p>{$t.withdrawModal.info1}</p>
          <p class="warning">{$t.withdrawModal.info2}</p>
        </div>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="buttons">
          <button class="submit-btn" onclick={handleSubmit} disabled={loading || availableBalance <= 0}>
            {loading ? $t.withdrawModal.processing : $t.withdrawModal.submit}
          </button>
          <button class="cancel-btn" onclick={close} disabled={loading}>
            {$t.withdrawModal.cancel}
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

  .modal-header.success {
    color: #4ade80;
    text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
  }

  .balance-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(0, 231, 1, 0.1);
    border: 1px solid rgba(0, 231, 1, 0.3);
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .balance-display :global(svg) {
    color: #00e701;
  }

  .balance-display .label {
    color: #b1bad3;
    font-size: 0.9em;
  }

  .balance-display .value {
    color: #00e701;
    font-size: 1.2em;
    font-weight: bold;
    margin-left: auto;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    color: #b1bad3;
    font-size: 0.9em;
    margin-bottom: 8px;
  }

  .amount-input-group {
    display: flex;
    align-items: center;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    overflow: hidden;
  }

  .amount-input-group:focus-within {
    border-color: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.3);
  }

  .currency {
    padding: 0 12px;
    color: #00e701;
    font-size: 1.1em;
    font-weight: bold;
  }

  .amount-input {
    flex: 1;
    padding: 14px 0;
    font-size: 1.1em;
    background: transparent;
    border: none;
    color: #fff;
    outline: none;
  }

  .amount-input::placeholder {
    color: #666;
  }

  /* Hide number input spinners */
  .amount-input::-webkit-outer-spin-button,
  .amount-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .amount-input[type=number] {
    -moz-appearance: textfield;
  }

  .max-btn {
    padding: 8px 12px;
    margin: 4px;
    background: rgba(0, 231, 1, 0.2);
    border: none;
    border-radius: 6px;
    color: #00e701;
    font-weight: bold;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .max-btn:hover:not(:disabled) {
    background: rgba(0, 231, 1, 0.3);
  }

  .max-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .address-input {
    width: 100%;
    padding: 14px 12px;
    font-size: 0.95em;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    color: #fff;
    font-family: monospace;
  }

  .address-input:focus {
    outline: none;
    border-color: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.3);
  }

  .address-input::placeholder {
    color: #666;
    font-family: inherit;
  }

  .info {
    text-align: center;
    margin-bottom: 16px;
    font-size: 0.85em;
    line-height: 1.4;
  }

  .info p {
    margin: 4px 0;
    color: #b1bad3;
  }

  .info .warning {
    color: #ffa500;
  }

  .success-info {
    text-align: center;
    margin-bottom: 20px;
  }

  .amount-display {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.3);
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .amount-display .label {
    color: #b1bad3;
    font-size: 0.9em;
  }

  .amount-display .value {
    color: #4ade80;
    font-size: 1.8em;
    font-weight: bold;
  }

  .success-info p {
    color: #b1bad3;
    font-size: 0.9em;
    margin: 8px 0;
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
