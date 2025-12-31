<script lang="ts">
  import { ChevronDown, Coins, DollarSign } from 'lucide-svelte';
  import { playerWallet } from '$lib/stores/playerWallet';
  import { t } from '$lib/i18n';

  let {
    show = $bindable(false),
    scratchCode,
    totalWinnings,
    gameId = 'scratch',
    onPlayMore,
    onRequestSubmitted,
  }: {
    show: boolean;
    scratchCode: string;
    totalWinnings: number;
    gameId?: string;
    onPlayMore?: () => void;
    onRequestSubmitted?: () => void;
  } = $props();

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

  type ActionType = 'payout' | 'credits';

  // Form state
  let playerName = $state('');
  let selectedCountry = $state('US');
  let phoneNumber = $state('');
  let submitting = $state(false);
  let submitted = $state(false);
  let submittedAction = $state<ActionType>('payout');
  let submittedAmount = $state(0);  // Store amount at time of submission
  let error = $state('');

  // Get selected country info
  let selectedCountryInfo = $derived(countries.find(c => c.code === selectedCountry) || countries[0]);

  // Form validation
  let isFormValid = $derived(
    playerName.trim().length >= 2 && phoneNumber.trim().length >= 6
  );

  function close(): void {
    show = false;
    // Always reset form state when closing
    playerName = '';
    phoneNumber = '';
    error = '';
    submitted = false;
    submittedAmount = 0;
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function validateForm(): boolean {
    error = '';

    if (!playerName.trim() || playerName.trim().length < 2) {
      error = $t.claimModal.nameError;
      return false;
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      error = $t.claimModal.phoneError;
      return false;
    }

    return true;
  }

  async function handleConvertToCredits(): Promise<void> {
    if (!validateForm()) return;

    submitting = true;

    try {
      const fullPhone = `${selectedCountryInfo.dial} ${phoneNumber.trim()}`;

      // Record the credit conversion with player info
      const response = await fetch('/api/game/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: scratchCode,
          gameId,
          amount: totalWinnings,
          playerName: playerName.trim(),
          playerPhone: fullPhone,
          playerCountry: selectedCountry
        })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.claimModal.convertError;
        submitting = false;
        return;
      }

      // Store the amount before conversion (since totalWinnings will become 0)
      submittedAmount = totalWinnings;
      submitted = true;
      submittedAction = 'credits';
      submitting = false;

      // Call the onPlayMore callback to actually convert credits
      if (onPlayMore) {
        onPlayMore();
      }
    } catch {
      error = $t.claimModal.connectionError;
      submitting = false;
    }
  }

  async function submitPayoutRequest(): Promise<void> {
    if (!validateForm()) return;

    submitting = true;

    try {
      const fullPhone = `${selectedCountryInfo.dial} ${phoneNumber.trim()}`;

      const response = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: scratchCode,
          amount: totalWinnings,
          playerName: playerName.trim(),
          playerPhone: fullPhone,
          playerCountry: selectedCountry
        })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.claimModal.requestError;
        submitting = false;
        return;
      }

      // Store the amount before clearing (since totalWinnings will become 0)
      submittedAmount = totalWinnings;
      submitted = true;
      submittedAction = 'payout';
      submitting = false;

      // Clear the wallet after payout request is submitted
      playerWallet.clear();

      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch {
      error = $t.claimModal.connectionError;
      submitting = false;
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      {#if submitted}
        <div class="success-view">
          <div class="success-icon">✓</div>
          {#if submittedAction === 'payout'}
            <div class="modal-header">{$t.claimModal.requestSent}</div>
            <div class="winnings">
              <span class="label">{$t.claimModal.amountRequested}</span>
              <span class="amount">${submittedAmount.toFixed(2)}</span>
            </div>
            <div class="info">
              <p>{$t.claimModal.payoutInfo1}</p>
              <p>{$t.claimModal.payoutInfo2}</p>
              <p class="code-ref">{$t.claimModal.codeRef}: <strong>{scratchCode}</strong></p>
            </div>
          {:else}
            <div class="modal-header">{$t.claimModal.creditsAdded}</div>
            <div class="winnings credits-added">
              <span class="label">{$t.claimModal.creditsAddedAmount}</span>
              <span class="amount">${submittedAmount.toFixed(2)}</span>
            </div>
            <div class="info">
              <p>{$t.claimModal.creditsInfo1}</p>
              <p>{$t.claimModal.creditsInfo2}</p>
            </div>
          {/if}
          <button class="close-btn" onclick={close}>
            {submittedAction === 'credits' ? $t.claimModal.letsPlay : $t.claimModal.close}
          </button>
        </div>
      {:else}
        <div class="modal-header">{$t.claimModal.whatToDo}</div>

        <div class="winnings">
          <span class="label">{$t.claimModal.totalWinnings}</span>
          <span class="amount">${totalWinnings.toFixed(2)}</span>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label for="playerName">{$t.claimModal.fullName} <span class="required">{$t.claimModal.required}</span></label>
            <input
              type="text"
              id="playerName"
              bind:value={playerName}
              placeholder={$t.claimModal.namePlaceholder}
              disabled={submitting}
            />
          </div>

          <div class="form-group">
            <label for="phone">{$t.claimModal.phoneNumber} <span class="required">{$t.claimModal.required}</span></label>
            <div class="phone-input">
              <div class="country-select">
                <select bind:value={selectedCountry} disabled={submitting}>
                  {#each countries as country}
                    <option value={country.code}>{country.dial} {country.name}</option>
                  {/each}
                </select>
                <ChevronDown size={16} />
              </div>
              <input
                type="tel"
                id="phone"
                bind:value={phoneNumber}
                placeholder={$t.claimModal.phonePlaceholder}
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        {#if error}
          <div class="error-message">{error}</div>
        {/if}

        <div class="info">
          <p>{$t.claimModal.completeInfo}</p>
        </div>

        <div class="button-group">
          <button
            class="submit-btn payout-btn"
            onclick={submitPayoutRequest}
            disabled={submitting || !isFormValid}
          >
            <DollarSign size={20} />
            {submitting ? $t.claimModal.sending : $t.claimModal.requestPayout}
          </button>

          {#if onPlayMore}
            <button
              class="submit-btn credits-btn"
              onclick={handleConvertToCredits}
              disabled={submitting || !isFormValid}
            >
              <Coins size={20} />
              {submitting ? $t.claimModal.processing : $t.claimModal.convertToCredits}
            </button>
          {/if}

          <button class="cancel-btn" onclick={close} disabled={submitting}>{$t.claimModal.cancel}</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    z-index: 100;
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
    background: linear-gradient(#222, #333);
    border: 3px solid #ffd700;
    border-radius: 16px;
    padding: 20px 16px;
    width: 100%;
    max-width: 380px;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    box-shadow: 0 0 30px #ff0;
    text-align: center;
  }

  .modal-header {
    font-size: 1.4em;
    margin-bottom: 12px;
    text-shadow: 0 0 10px #ff0;
    color: #ffd700;
  }

  .winnings {
    background: linear-gradient(#1a1a1a, #0d0d0d);
    border: 2px solid #ffd700;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 16px;
  }

  .winnings.credits-added {
    border-color: #00cc00;
  }

  .winnings.credits-added .amount {
    color: #00ff00;
    text-shadow: 0 0 15px #0f0;
  }

  .winnings .label {
    display: block;
    color: #aaa;
    font-size: 0.85em;
    margin-bottom: 4px;
  }

  .winnings .amount {
    display: block;
    color: #00ff00;
    font-size: 2em;
    font-weight: bold;
    text-shadow: 0 0 15px #0f0;
  }

  .form-section {
    text-align: left;
    margin-bottom: 12px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    display: block;
    color: #aaa;
    font-size: 0.85em;
    margin-bottom: 6px;
  }

  .form-group label .required {
    color: #ff6666;
  }

  .form-group input {
    width: 100%;
    padding: 12px;
    background: #1a1a1a;
    border: 2px solid #444;
    border-radius: 8px;
    color: #fff;
    font-size: 1em;
    transition: border-color 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: #ffd700;
  }

  .form-group input::placeholder {
    color: #666;
  }

  .phone-input {
    display: flex;
    gap: 8px;
  }

  .country-select {
    position: relative;
    flex-shrink: 0;
  }

  .country-select select {
    appearance: none;
    padding: 12px 32px 12px 12px;
    background: #1a1a1a;
    border: 2px solid #444;
    border-radius: 8px;
    color: #fff;
    font-size: 0.9em;
    cursor: pointer;
    min-width: 100px;
  }

  .country-select select:focus {
    outline: none;
    border-color: #ffd700;
  }

  .country-select :global(svg) {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
    pointer-events: none;
  }

  .phone-input input {
    flex: 1;
    min-width: 0;
  }

  .error-message {
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    border-radius: 8px;
    padding: 10px;
    color: #ff6666;
    font-size: 0.9em;
    margin-bottom: 12px;
  }

  .info {
    color: #aaa;
    font-size: 0.8em;
    line-height: 1.4;
    margin-bottom: 12px;
  }

  .info p {
    margin: 4px 0;
  }

  .code-ref {
    margin-top: 8px;
    color: #ffd700;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    font-size: 1.1em;
    width: 100%;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
    transition: transform 0.1s, opacity 0.2s;
  }

  .submit-btn.payout-btn {
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
  }

  .submit-btn.credits-btn {
    background: linear-gradient(#00cc00, #008800);
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  }

  .submit-btn:hover:not(:disabled) {
    transform: scale(1.02);
  }

  .submit-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cancel-btn {
    padding: 12px;
    font-size: 1em;
    width: 100%;
    background: transparent;
    color: #888;
    border: 1px solid #444;
    border-radius: 10px;
    cursor: pointer;
  }

  .cancel-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: #aaa;
  }

  .cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .close-btn {
    padding: 14px;
    font-size: 1.2em;
    width: 100%;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }

  .close-btn:active {
    transform: scale(0.98);
  }

  .success-view {
    text-align: center;
  }

  .success-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 16px;
    background: linear-gradient(#00cc00, #008800);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    color: #fff;
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 24px 20px;
    }
    .modal-header {
      font-size: 1.5em;
      margin-bottom: 16px;
    }
    .winnings {
      padding: 16px;
    }
    .winnings .amount {
      font-size: 2.2em;
    }
  }
</style>
