<script lang="ts">
  import { ArrowUpFromLine, Wallet, CircleDollarSign, Banknote, ChevronDown, Shield } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import { usdtBalance, isEmailOnlyUser, playerAuth } from '$lib/stores/playerAuth';

  let {
    show = $bindable(false),
    onWithdrawSuccess,
  }: {
    show: boolean;
    onWithdrawSuccess?: (newBalance: number) => void;
  } = $props();

  type WithdrawMode = 'select' | 'crypto' | 'cash' | '2fa';
  type Network = 'ethereum' | 'bsc' | 'polygon';

  interface WithdrawData {
    type: 'crypto' | 'cash';
    amount: number;
    // Crypto fields
    network?: string;
    walletAddress?: string;
    // Cash fields
    playerName?: string;
    playerPhone?: string;
    playerCountry?: string;
  }

  // Country codes for dropdown
  const countries = [
    { code: 'US', name: 'United States', dial: '+1' },
    { code: 'MX', name: 'México', dial: '+52' },
    { code: 'GT', name: 'Guatemala', dial: '+502' },
    { code: 'SV', name: 'El Salvador', dial: '+503' },
    { code: 'HN', name: 'Honduras', dial: '+504' },
    { code: 'NI', name: 'Nicaragua', dial: '+505' },
    { code: 'CR', name: 'Costa Rica', dial: '+506' },
    { code: 'PA', name: 'Panamá', dial: '+507' },
    { code: 'CO', name: 'Colombia', dial: '+57' },
    { code: 'VE', name: 'Venezuela', dial: '+58' },
    { code: 'EC', name: 'Ecuador', dial: '+593' },
    { code: 'PE', name: 'Perú', dial: '+51' },
    { code: 'BO', name: 'Bolivia', dial: '+591' },
    { code: 'CL', name: 'Chile', dial: '+56' },
    { code: 'AR', name: 'Argentina', dial: '+54' },
    { code: 'UY', name: 'Uruguay', dial: '+598' },
    { code: 'PY', name: 'Paraguay', dial: '+595' },
    { code: 'BR', name: 'Brasil', dial: '+55' },
    { code: 'ES', name: 'España', dial: '+34' },
    { code: 'DO', name: 'República Dominicana', dial: '+1' },
    { code: 'PR', name: 'Puerto Rico', dial: '+1' },
    { code: 'CU', name: 'Cuba', dial: '+53' },
  ];

  const networkNames: Record<Network, string> = {
    ethereum: 'Ethereum (ERC-20)',
    bsc: 'BNB Smart Chain (BEP-20)',
    polygon: 'Polygon'
  };

  const networkColors: Record<Network, string> = {
    ethereum: '#627eea',
    bsc: '#f3ba2f',
    polygon: '#8247e5'
  };

  // State
  let withdrawMode = $state<WithdrawMode>('select');
  let amount = $state('');
  let walletAddress = $state('');
  let selectedNetwork = $state<Network>('ethereum');
  let playerName = $state('');
  let selectedCountry = $state('US');
  let phoneNumber = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);
  let successType = $state<'crypto' | 'cash'>('crypto');

  // 2FA state
  let verificationCode = $state('');
  let pendingWithdrawType = $state<'crypto' | 'cash'>('crypto');
  let sending2FA = $state(false);
  let codeSentMessage = $state('');

  // Calculate available balance - now unified from USDT balance
  let availableBalance = $derived($usdtBalance);

  // Get selected country info
  let selectedCountryInfo = $derived(countries.find(c => c.code === selectedCountry) || countries[0]);

  function close(): void {
    show = false;
    withdrawMode = 'select';
    amount = '';
    walletAddress = '';
    selectedNetwork = 'ethereum';
    playerName = '';
    phoneNumber = '';
    error = '';
    success = false;
    verificationCode = '';
    codeSentMessage = '';
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function setMaxAmount(): void {
    amount = availableBalance.toFixed(2);
  }

  function validateAmount(): boolean {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      error = $t.withdrawModal.amountError;
      return false;
    }
    if (numAmount > availableBalance) {
      error = $t.withdrawModal.insufficientBalance;
      return false;
    }
    return true;
  }

  async function request2FACode(): Promise<boolean> {
    const authState = playerAuth.get();
    if (!authState.token) return false;

    sending2FA = true;
    codeSentMessage = '';
    error = '';

    try {
      const response = await fetch('/api/withdraw/request-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.withdrawModal.codeError;
        return false;
      }

      // If user doesn't require 2FA (MetaMask user), return true to proceed directly
      if (data.requires2FA === false) {
        return true;
      }

      return true;
    } catch (e) {
      error = $t.withdrawModal.codeError;
      return false;
    } finally {
      sending2FA = false;
    }
  }

  async function verify2FACode(): Promise<boolean> {
    const authState = playerAuth.get();
    if (!authState.token) return false;

    try {
      const response = await fetch('/api/withdraw/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({ code: verificationCode })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.withdrawModal.invalidCode;
        return false;
      }

      return data.verified === true;
    } catch (e) {
      error = $t.withdrawModal.invalidCode;
      return false;
    }
  }

  async function submitWithdrawal(data: WithdrawData): Promise<{ success: boolean; newBalance?: number }> {
    const authState = playerAuth.get();
    if (!authState.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/withdraw/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || $t.withdrawModal.requestError);
    }

    return { success: true, newBalance: result.newBalance };
  }

  async function resend2FACode(): Promise<void> {
    sending2FA = true;
    codeSentMessage = '';
    error = '';

    const success = await request2FACode();
    if (success) {
      codeSentMessage = $t.withdrawModal.codeSent;
    }
    sending2FA = false;
  }

  async function handleCryptoSubmit(): Promise<void> {
    if (!validateAmount()) return;

    if (!walletAddress.trim()) {
      error = $t.withdrawModal.addressError;
      return;
    }

    // Basic wallet address validation (starts with 0x and has 42 chars for EVM)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      error = $t.withdrawModal.invalidAddress;
      return;
    }

    // Check if user is email-only (requires 2FA)
    if ($isEmailOnlyUser) {
      loading = true;
      error = '';
      const codeRequested = await request2FACode();
      loading = false;

      if (codeRequested) {
        pendingWithdrawType = 'crypto';
        withdrawMode = '2fa';
      }
      return;
    }

    // MetaMask users proceed directly
    loading = true;
    error = '';

    try {
      const result = await submitWithdrawal({
        type: 'crypto',
        amount: parseFloat(amount),
        network: selectedNetwork,
        walletAddress: walletAddress.trim()
      });

      if (result.newBalance !== undefined) {
        playerAuth.updateBalance(result.newBalance);
        onWithdrawSuccess?.(result.newBalance);
      }

      successType = 'crypto';
      success = true;
    } catch (e) {
      error = e instanceof Error ? e.message : $t.withdrawModal.requestError;
    } finally {
      loading = false;
    }
  }

  async function handleCashSubmit(): Promise<void> {
    if (!validateAmount()) return;

    if (!playerName.trim() || playerName.trim().length < 2) {
      error = $t.withdrawModal.nameError;
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      error = $t.withdrawModal.phoneError;
      return;
    }

    // Check if user is email-only (requires 2FA)
    if ($isEmailOnlyUser) {
      loading = true;
      error = '';
      const codeRequested = await request2FACode();
      loading = false;

      if (codeRequested) {
        pendingWithdrawType = 'cash';
        withdrawMode = '2fa';
      }
      return;
    }

    // MetaMask users proceed directly
    loading = true;
    error = '';

    try {
      const fullPhone = `${selectedCountryInfo.dial} ${phoneNumber.trim()}`;

      const result = await submitWithdrawal({
        type: 'cash',
        amount: parseFloat(amount),
        playerName: playerName.trim(),
        playerPhone: fullPhone,
        playerCountry: selectedCountry
      });

      if (result.newBalance !== undefined) {
        playerAuth.updateBalance(result.newBalance);
        onWithdrawSuccess?.(result.newBalance);
      }

      successType = 'cash';
      success = true;
    } catch (e) {
      error = e instanceof Error ? e.message : $t.withdrawModal.requestError;
    } finally {
      loading = false;
    }
  }

  async function handle2FAVerifyAndSubmit(): Promise<void> {
    if (!verificationCode.trim() || !/^\d{6}$/.test(verificationCode.trim())) {
      error = $t.withdrawModal.invalidCode;
      return;
    }

    loading = true;
    error = '';

    // First verify the 2FA code
    const verified = await verify2FACode();
    if (!verified) {
      loading = false;
      return;
    }

    // Then proceed with the actual withdrawal
    try {
      let result;
      if (pendingWithdrawType === 'crypto') {
        result = await submitWithdrawal({
          type: 'crypto',
          amount: parseFloat(amount),
          network: selectedNetwork,
          walletAddress: walletAddress.trim()
        });
        successType = 'crypto';
      } else {
        const fullPhone = `${selectedCountryInfo.dial} ${phoneNumber.trim()}`;
        result = await submitWithdrawal({
          type: 'cash',
          amount: parseFloat(amount),
          playerName: playerName.trim(),
          playerPhone: fullPhone,
          playerCountry: selectedCountry
        });
        successType = 'cash';
      }

      if (result.newBalance !== undefined) {
        playerAuth.updateBalance(result.newBalance);
        onWithdrawSuccess?.(result.newBalance);
      }

      success = true;
    } catch (e) {
      error = e instanceof Error ? e.message : $t.withdrawModal.requestError;
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (withdrawMode === '2fa') {
        // Go back to the previous form (crypto or cash)
        withdrawMode = pendingWithdrawType;
        verificationCode = '';
        error = '';
        codeSentMessage = '';
      } else if (withdrawMode !== 'select' && !success) {
        withdrawMode = 'select';
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
  <div class="modal" onclick={handleBackdropClick} onkeydown={handleKeydown}>
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
          {#if successType === 'crypto'}
            <p>{$t.withdrawModal.cryptoSuccessInfo1}</p>
            <p>{$t.withdrawModal.cryptoSuccessInfo2}</p>
          {:else}
            <p>{$t.withdrawModal.cashSuccessInfo1}</p>
            <p>{$t.withdrawModal.cashSuccessInfo2}</p>
          {/if}
        </div>

        <button class="submit-btn" onclick={close}>
          {$t.withdrawModal.close}
        </button>

      {:else if withdrawMode === 'select'}
        <!-- Method Selection -->
        <div class="modal-header">
          <ArrowUpFromLine size={24} />
          <span>{$t.withdrawModal.title}</span>
        </div>

        <div class="balance-display">
          <Wallet size={18} />
          <span class="label">{$t.withdrawModal.availableBalance}</span>
          <span class="value">${availableBalance.toFixed(2)}</span>
        </div>

        <div class="withdraw-options">
          <button
            class="option-btn crypto"
            onclick={() => withdrawMode = 'crypto'}
            disabled={availableBalance <= 0}
          >
            <CircleDollarSign size={24} />
            <div class="option-text">
              <span class="option-title">{$t.withdrawModal.cryptoTitle}</span>
              <span class="option-desc">{$t.withdrawModal.cryptoDesc}</span>
            </div>
          </button>

          <button
            class="option-btn cash"
            onclick={() => withdrawMode = 'cash'}
            disabled={availableBalance <= 0}
          >
            <Banknote size={24} />
            <div class="option-text">
              <span class="option-title">{$t.withdrawModal.cashTitle}</span>
              <span class="option-desc">{$t.withdrawModal.cashDesc}</span>
            </div>
          </button>
        </div>

        <button class="cancel-btn" onclick={close}>
          {$t.withdrawModal.cancel}
        </button>

      {:else if withdrawMode === 'crypto'}
        <!-- Crypto Withdrawal -->
        <div class="modal-header">
          <CircleDollarSign size={24} />
          <span>{$t.withdrawModal.cryptoTitle}</span>
        </div>

        <div class="form-group">
          <label for="crypto-amount">{$t.withdrawModal.amount}</label>
          <div class="amount-input-group">
            <span class="currency">$</span>
            <input
              id="crypto-amount"
              type="number"
              bind:value={amount}
              placeholder="0.00"
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

        <div class="network-label">{$t.withdrawModal.selectNetwork}</div>
        <div class="network-tabs">
          {#each (['ethereum', 'bsc', 'polygon'] as Network[]) as network}
            <button
              class="network-tab"
              class:active={selectedNetwork === network}
              onclick={() => selectedNetwork = network}
              style="--network-color: {networkColors[network]}"
            >
              <span class="network-name">{network === 'ethereum' ? 'ETH' : network === 'bsc' ? 'BSC' : 'Polygon'}</span>
            </button>
          {/each}
        </div>

        <div class="form-group">
          <label for="address">{$t.withdrawModal.walletAddress}</label>
          <input
            id="address"
            type="text"
            bind:value={walletAddress}
            placeholder={$t.withdrawModal.addressPlaceholder}
            disabled={loading}
            class="address-input"
          />
        </div>

        <div class="info">
          <p>{$t.withdrawModal.cryptoInfo1}</p>
          <p class="warning">{$t.withdrawModal.cryptoInfo2}</p>
        </div>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="buttons">
          <button class="submit-btn" onclick={handleCryptoSubmit} disabled={loading || availableBalance <= 0}>
            {loading ? $t.withdrawModal.processing : $t.withdrawModal.submit}
          </button>
          <button class="cancel-btn" onclick={() => { withdrawMode = 'select'; error = ''; }} disabled={loading}>
            {$t.withdrawModal.back}
          </button>
        </div>

      {:else if withdrawMode === 'cash'}
        <!-- Cash Withdrawal -->
        <div class="modal-header">
          <Banknote size={24} />
          <span>{$t.withdrawModal.cashTitle}</span>
        </div>

        <div class="form-group">
          <label for="cash-amount">{$t.withdrawModal.amount}</label>
          <div class="amount-input-group">
            <span class="currency">$</span>
            <input
              id="cash-amount"
              type="number"
              bind:value={amount}
              placeholder="0.00"
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
          <label for="name">{$t.withdrawModal.fullName} <span class="required">*</span></label>
          <input
            id="name"
            type="text"
            bind:value={playerName}
            placeholder={$t.withdrawModal.namePlaceholder}
            disabled={loading}
            class="text-input"
          />
        </div>

        <div class="form-group">
          <label for="phone">{$t.withdrawModal.phoneNumber} <span class="required">*</span></label>
          <div class="phone-input-group">
            <div class="country-select">
              <select bind:value={selectedCountry} disabled={loading}>
                {#each countries as country}
                  <option value={country.code}>{country.dial}</option>
                {/each}
              </select>
              <ChevronDown size={16} />
            </div>
            <input
              id="phone"
              type="tel"
              bind:value={phoneNumber}
              placeholder={$t.withdrawModal.phonePlaceholder}
              disabled={loading}
              class="phone-input"
            />
          </div>
        </div>

        <div class="info">
          <p>{$t.withdrawModal.cashInfo1}</p>
          <p>{$t.withdrawModal.cashInfo2}</p>
        </div>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="buttons">
          <button class="submit-btn" onclick={handleCashSubmit} disabled={loading || availableBalance <= 0}>
            {loading ? $t.withdrawModal.processing : $t.withdrawModal.submit}
          </button>
          <button class="cancel-btn" onclick={() => { withdrawMode = 'select'; error = ''; }} disabled={loading}>
            {$t.withdrawModal.back}
          </button>
        </div>

      {:else if withdrawMode === '2fa'}
        <!-- 2FA Verification -->
        <div class="modal-header">
          <Shield size={24} />
          <span>{$t.withdrawModal.verificationTitle}</span>
        </div>

        <div class="amount-display verification">
          <span class="label">{$t.withdrawModal.amountRequested}</span>
          <span class="value">${parseFloat(amount).toFixed(2)}</span>
        </div>

        <div class="verification-instruction">
          <p>{$t.withdrawModal.verificationInstruction}</p>
        </div>

        <div class="form-group">
          <input
            type="text"
            bind:value={verificationCode}
            placeholder={$t.withdrawModal.verificationPlaceholder}
            disabled={loading || sending2FA}
            maxlength="6"
            class="verification-input"
            inputmode="numeric"
            pattern="[0-9]*"
          />
        </div>

        <div class="expires-note">
          <p>{$t.withdrawModal.codeExpires}</p>
        </div>

        {#if codeSentMessage}
          <div class="success-message">{codeSentMessage}</div>
        {/if}

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="buttons">
          <button class="submit-btn" onclick={handle2FAVerifyAndSubmit} disabled={loading || sending2FA}>
            {loading ? $t.withdrawModal.verifying : $t.withdrawModal.verify}
          </button>
          <button class="resend-btn" onclick={resend2FACode} disabled={loading || sending2FA}>
            {sending2FA ? $t.withdrawModal.sending : $t.withdrawModal.resendCode}
          </button>
          <button class="cancel-btn" onclick={() => { withdrawMode = pendingWithdrawType; verificationCode = ''; error = ''; codeSentMessage = ''; }} disabled={loading || sending2FA}>
            {$t.withdrawModal.back}
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
    border: 3px solid #f97316;
    border-radius: 16px;
    padding: 20px 16px;
    width: 100%;
    max-width: 400px;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    box-shadow: 0 0 30px rgba(249, 115, 22, 0.3);
  }

  .modal-header {
    font-size: 1.3em;
    margin-bottom: 20px;
    text-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
    color: #f97316;
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
    background: rgba(249, 115, 22, 0.1);
    border: 1px solid rgba(249, 115, 22, 0.3);
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .balance-display :global(svg) {
    color: #f97316;
  }

  .balance-display .label {
    color: #b1bad3;
    font-size: 0.9em;
  }

  .balance-display .value {
    color: #f97316;
    font-size: 1.2em;
    font-weight: bold;
    margin-left: auto;
  }

  .withdraw-options {
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

  .option-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #f97316;
  }

  .option-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-btn.crypto :global(svg) {
    color: #26a17b;
    flex-shrink: 0;
  }

  .option-btn.cash :global(svg) {
    color: #4ade80;
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

  .form-group label {
    display: block;
    color: #b1bad3;
    font-size: 0.9em;
    margin-bottom: 8px;
  }

  .required {
    color: #ff4444;
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
    border-color: #f97316;
    box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
  }

  .currency {
    padding: 0 12px;
    color: #f97316;
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
    background: rgba(249, 115, 22, 0.2);
    border: none;
    border-radius: 6px;
    color: #f97316;
    font-weight: bold;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .max-btn:hover:not(:disabled) {
    background: rgba(249, 115, 22, 0.3);
  }

  .max-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .network-label {
    color: #b1bad3;
    font-size: 0.9em;
    margin-bottom: 10px;
  }

  .network-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .network-tab {
    flex: 1;
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
    border-color: var(--network-color, #627eea);
    color: var(--network-color, #627eea);
    background: rgba(255, 255, 255, 0.1);
  }

  .address-input,
  .text-input {
    width: 100%;
    padding: 14px 12px;
    font-size: 0.95em;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    color: #fff;
  }

  .address-input {
    font-family: monospace;
  }

  .address-input:focus,
  .text-input:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
  }

  .address-input::placeholder,
  .text-input::placeholder {
    color: #666;
  }

  .phone-input-group {
    display: flex;
    gap: 8px;
  }

  .country-select {
    position: relative;
    flex-shrink: 0;
  }

  .country-select select {
    appearance: none;
    padding: 14px 32px 14px 12px;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    color: #fff;
    font-size: 0.95em;
    cursor: pointer;
  }

  .country-select select:focus {
    outline: none;
    border-color: #f97316;
  }

  .country-select :global(svg) {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
  }

  .phone-input {
    flex: 1;
    padding: 14px 12px;
    font-size: 0.95em;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    color: #fff;
  }

  .phone-input:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
  }

  .phone-input::placeholder {
    color: #666;
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
    background: linear-gradient(#f97316, #ea580c);
    color: #fff;
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

  /* 2FA Verification styles */
  .amount-display.verification {
    background: rgba(249, 115, 22, 0.1);
    border-color: rgba(249, 115, 22, 0.3);
    text-align: center;
  }

  .amount-display.verification .value {
    color: #f97316;
  }

  .verification-instruction {
    text-align: center;
    margin-bottom: 16px;
  }

  .verification-instruction p {
    color: #b1bad3;
    font-size: 0.95em;
  }

  .verification-input {
    width: 100%;
    padding: 16px;
    font-size: 1.5em;
    font-weight: bold;
    text-align: center;
    letter-spacing: 8px;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    color: #00e701;
  }

  .verification-input:focus {
    outline: none;
    border-color: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.3);
  }

  .verification-input::placeholder {
    color: #666;
    letter-spacing: 2px;
    font-size: 0.7em;
  }

  .expires-note {
    text-align: center;
    margin-bottom: 12px;
  }

  .expires-note p {
    color: #888;
    font-size: 0.85em;
  }

  .success-message {
    color: #4ade80;
    text-align: center;
    margin-bottom: 12px;
    font-size: 0.9em;
    padding: 8px;
    background: rgba(74, 222, 128, 0.1);
    border-radius: 8px;
  }

  .resend-btn {
    padding: 12px;
    font-size: 0.95em;
    width: 100%;
    background: rgba(0, 231, 1, 0.1);
    color: #00e701;
    border: 1px solid rgba(0, 231, 1, 0.3);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .resend-btn:hover:not(:disabled) {
    background: rgba(0, 231, 1, 0.2);
  }

  .resend-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 24px 20px;
    }
  }
</style>
