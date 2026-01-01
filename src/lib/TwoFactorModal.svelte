<script lang="ts">
  import { Shield, Mail, RefreshCw } from 'lucide-svelte';
  import { t, setLanguage, type Language } from '$lib/i18n';
  import { playerAuth } from '$lib/stores/playerAuth';

  let {
    show = $bindable(false),
    userId = '',
    email = '',
    onCancel,
  }: {
    show: boolean;
    userId: string;
    email: string;
    onCancel?: () => void;
  } = $props();

  // Form state
  let code = $state('');
  let submitting = $state(false);
  let resending = $state(false);
  let error = $state('');
  let resendMessage = $state('');

  // Individual digit inputs for better UX
  let digits = $state(['', '', '', '', '', '']);
  let inputRefs: HTMLInputElement[] = [];

  function close(): void {
    show = false;
    code = '';
    digits = ['', '', '', '', '', ''];
    error = '';
    resendMessage = '';
    if (onCancel) {
      onCancel();
    }
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      input.value = digits[index];
      return;
    }

    digits[index] = value;
    digits = [...digits]; // Trigger reactivity

    // Move to next input if digit entered
    if (value && index < 5) {
      inputRefs[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digits.every(d => d !== '') && digits.join('').length === 6) {
      handleVerify();
    }
  }

  function handleKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs[index - 1]?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1]?.focus();
    } else if (event.key === 'Escape') {
      close();
    }
  }

  function handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digitsOnly.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < digitsOnly.length; i++) {
        newDigits[i] = digitsOnly[i];
      }
      digits = newDigits;

      // Focus the next empty input or last input
      const nextEmpty = newDigits.findIndex(d => d === '');
      if (nextEmpty !== -1) {
        inputRefs[nextEmpty]?.focus();
      } else {
        inputRefs[5]?.focus();
        // Auto-submit if all digits pasted
        handleVerify();
      }
    }
  }

  async function handleVerify(): Promise<void> {
    const fullCode = digits.join('');

    if (fullCode.length !== 6) {
      error = $t.twoFactor.enterCode;
      return;
    }

    submitting = true;
    error = '';
    resendMessage = '';

    try {
      const response = await fetch('/api/player/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: fullCode })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.twoFactor.invalidCode;
        submitting = false;
        return;
      }

      playerAuth.login(data.token, data.user);
      // Set language from user preference
      if (data.user.preferredLanguage) {
        setLanguage(data.user.preferredLanguage as Language);
      }
      close();
    } catch {
      error = $t.authModal.connectionError;
    } finally {
      submitting = false;
    }
  }

  async function handleResend(): Promise<void> {
    resending = true;
    error = '';
    resendMessage = '';

    try {
      const response = await fetch('/api/player/resend-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.twoFactor.resendError;
        resending = false;
        return;
      }

      resendMessage = $t.twoFactor.codeSent;
      // Clear inputs for new code
      digits = ['', '', '', '', '', ''];
      inputRefs[0]?.focus();
    } catch {
      error = $t.authModal.connectionError;
    } finally {
      resending = false;
    }
  }

  // Focus first input when modal opens
  $effect(() => {
    if (show && inputRefs[0]) {
      setTimeout(() => inputRefs[0]?.focus(), 100);
    }
  });
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">
        <Shield size={24} />
        <span>{$t.twoFactor.title}</span>
      </div>

      <div class="info-section">
        <div class="email-display">
          <Mail size={16} />
          <span>{email}</span>
        </div>
        <p class="instruction">{$t.twoFactor.instruction}</p>
      </div>

      <div class="code-inputs">
        {#each digits as digit, i}
          <input
            type="text"
            inputmode="numeric"
            maxlength="1"
            bind:this={inputRefs[i]}
            value={digit}
            oninput={(e) => handleDigitInput(i, e)}
            onkeydown={(e) => handleKeydown(i, e)}
            onpaste={handlePaste}
            disabled={submitting}
            class:filled={digit !== ''}
          />
        {/each}
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      {#if resendMessage}
        <div class="success">{resendMessage}</div>
      {/if}

      <div class="buttons">
        <button class="submit-btn" onclick={handleVerify} disabled={submitting || digits.some(d => d === '')}>
          {submitting ? $t.twoFactor.verifying : $t.twoFactor.verify}
        </button>

        <button class="resend-btn" onclick={handleResend} disabled={submitting || resending}>
          <RefreshCw size={16} class={resending ? 'spinning' : ''} />
          {resending ? $t.twoFactor.sending : $t.twoFactor.resendCode}
        </button>

        <button class="cancel-btn" onclick={close} disabled={submitting}>
          {$t.authModal.cancel}
        </button>
      </div>

      <p class="expires-note">{$t.twoFactor.expiresNote}</p>
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
    padding: 24px 20px;
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

  .info-section {
    margin-bottom: 24px;
    text-align: center;
  }

  .email-display {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(0, 191, 255, 0.1);
    border: 1px solid #00bfff;
    border-radius: 8px;
    color: #00bfff;
    font-size: 0.95em;
    margin-bottom: 12px;
  }

  .instruction {
    color: #b1bad3;
    font-size: 0.9em;
    margin: 0;
    line-height: 1.4;
  }

  .code-inputs {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .code-inputs input {
    width: 45px;
    height: 55px;
    text-align: center;
    font-size: 1.5em;
    font-weight: bold;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    color: #fff;
    transition: all 0.2s;
  }

  .code-inputs input:focus {
    outline: none;
    border-color: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.3);
  }

  .code-inputs input.filled {
    border-color: #00e701;
    color: #00e701;
  }

  .code-inputs input:disabled {
    opacity: 0.6;
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

  .success {
    color: #00e701;
    text-align: center;
    margin-bottom: 16px;
    font-size: 0.9em;
    padding: 10px;
    background: rgba(0, 231, 1, 0.1);
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

  .resend-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    font-size: 1em;
    width: 100%;
    background: transparent;
    color: #00bfff;
    border: 2px solid #00bfff;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .resend-btn:hover:not(:disabled) {
    background: rgba(0, 191, 255, 0.1);
  }

  .resend-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .resend-btn :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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

  .expires-note {
    color: #666;
    font-size: 0.8em;
    text-align: center;
    margin: 16px 0 0 0;
  }

  @media (max-width: 360px) {
    .code-inputs input {
      width: 38px;
      height: 48px;
      font-size: 1.3em;
    }
  }
</style>
