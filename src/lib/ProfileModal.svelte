<script lang="ts">
  import { User, Mail, Lock, Wallet, Eye, EyeOff, Link } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import { playerAuth, playerUser } from '$lib/stores/playerAuth';

  let {
    show = $bindable(false),
  }: {
    show: boolean;
  } = $props();

  // Form state
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let fullName = $state('');
  let submitting = $state(false);
  let error = $state('');
  let success = $state(false);
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);

  // Check if user is MetaMask-only (no email linked)
  let isMetamaskOnly = $derived($playerUser?.metamaskAddress && !$playerUser?.email);

  function close(): void {
    show = false;
    email = '';
    password = '';
    confirmPassword = '';
    fullName = '';
    error = '';
    success = false;
    showPassword = false;
    showConfirmPassword = false;
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  async function handleLinkEmail(): Promise<void> {
    // Validate email
    if (!email.trim() || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      error = $t.authModal.emailError;
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      error = $t.authModal.passwordError;
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      error = $t.authModal.passwordMismatch;
      return;
    }

    submitting = true;
    error = '';

    try {
      const token = localStorage.getItem('playerToken');
      if (!token) {
        error = $t.authModal.connectionError;
        submitting = false;
        return;
      }

      const response = await fetch('/api/player/link-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.authModal.linkError;
        submitting = false;
        return;
      }

      // Update auth store with new token and user data
      playerAuth.login(data.token, data.user);
      success = true;
    } catch {
      error = $t.authModal.connectionError;
    } finally {
      submitting = false;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !submitting && isMetamaskOnly && !success) {
      handleLinkEmail();
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
      <div class="modal-header">
        <User size={24} />
        <span>{$t.profile.title}</span>
      </div>

      {#if success}
        <!-- Success State -->
        <div class="success-message">
          <div class="success-icon">
            <Link size={32} />
          </div>
          <p>{$t.profile.emailLinkedSuccess}</p>
        </div>

        <div class="buttons">
          <button class="submit-btn" onclick={close}>
            {$t.authModal.back}
          </button>
        </div>
      {:else}
        <!-- User Info Section -->
        <div class="user-info-section">
          <div class="info-row">
            <User size={16} />
            <span class="info-label">{$t.authModal.fullName}:</span>
            <span class="info-value">{$playerUser?.fullName || '-'}</span>
          </div>

          {#if $playerUser?.email}
            <div class="info-row">
              <Mail size={16} />
              <span class="info-label">{$t.authModal.email}:</span>
              <span class="info-value">{$playerUser.email}</span>
            </div>
          {/if}

          {#if $playerUser?.metamaskAddress}
            <div class="info-row">
              <Wallet size={16} />
              <span class="info-label">{$t.profile.wallet}:</span>
              <span class="info-value wallet-address">
                {$playerUser.metamaskAddress.slice(0, 6)}...{$playerUser.metamaskAddress.slice(-4)}
              </span>
            </div>
          {/if}
        </div>

        {#if isMetamaskOnly}
          <!-- Link Email Section for MetaMask-only accounts -->
          <div class="link-email-section">
            <div class="section-header">
              <Link size={18} />
              <span>{$t.profile.linkEmailTitle}</span>
            </div>

            <p class="link-info">{$t.profile.linkEmailInfo}</p>

            <div class="form-group">
              <label>
                <User size={16} />
                <span>{$t.authModal.fullName}</span>
              </label>
              <input
                type="text"
                bind:value={fullName}
                placeholder={$t.authModal.namePlaceholder}
                onkeydown={handleKeydown}
                disabled={submitting}
              />
            </div>

            <div class="form-group">
              <label>
                <Mail size={16} />
                <span>{$t.authModal.email}</span>
              </label>
              <input
                type="email"
                bind:value={email}
                placeholder={$t.authModal.emailPlaceholder}
                onkeydown={handleKeydown}
                disabled={submitting}
              />
            </div>

            <div class="form-group">
              <label>
                <Lock size={16} />
                <span>{$t.authModal.password}</span>
              </label>
              <div class="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  bind:value={password}
                  placeholder={$t.authModal.passwordPlaceholder}
                  onkeydown={handleKeydown}
                  disabled={submitting}
                />
                <button
                  type="button"
                  class="password-toggle"
                  onclick={() => showPassword = !showPassword}
                  disabled={submitting}
                  tabindex={-1}
                >
                  {#if showPassword}
                    <EyeOff size={18} />
                  {:else}
                    <Eye size={18} />
                  {/if}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>
                <Lock size={16} />
                <span>{$t.authModal.confirmPassword}</span>
              </label>
              <div class="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  bind:value={confirmPassword}
                  placeholder={$t.authModal.confirmPasswordPlaceholder}
                  onkeydown={handleKeydown}
                  disabled={submitting}
                />
                <button
                  type="button"
                  class="password-toggle"
                  onclick={() => showConfirmPassword = !showConfirmPassword}
                  disabled={submitting}
                  tabindex={-1}
                >
                  {#if showConfirmPassword}
                    <EyeOff size={18} />
                  {:else}
                    <Eye size={18} />
                  {/if}
                </button>
              </div>
            </div>

            {#if error}
              <div class="error">{error}</div>
            {/if}

            <div class="buttons">
              <button class="submit-btn" onclick={handleLinkEmail} disabled={submitting}>
                {submitting ? $t.authModal.linking : $t.profile.linkEmail}
              </button>
              <button class="cancel-btn" onclick={close}>
                {$t.authModal.cancel}
              </button>
            </div>
          </div>
        {:else}
          <!-- Regular user - just show close button -->
          <div class="buttons">
            <button class="cancel-btn" onclick={close}>
              {$t.authModal.back}
            </button>
          </div>
        {/if}
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

  .user-info-section {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-row :global(svg) {
    color: #00bfff;
    flex-shrink: 0;
  }

  .info-label {
    color: #7f8c8d;
    font-size: 0.9em;
  }

  .info-value {
    color: #fff;
    font-weight: 500;
    margin-left: auto;
    text-align: right;
  }

  .wallet-address {
    font-family: monospace;
    color: #f6851b;
  }

  .link-email-section {
    margin-top: 20px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #f6851b;
    font-size: 1.1em;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .link-info {
    color: #b1bad3;
    font-size: 0.9em;
    margin-bottom: 16px;
    line-height: 1.4;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #b1bad3;
    font-size: 0.9em;
    margin-bottom: 6px;
  }

  input {
    width: 100%;
    padding: 12px;
    font-size: 1em;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 8px;
    color: #fff;
  }

  input:focus {
    outline: none;
    border-color: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.2);
  }

  input::placeholder {
    color: #666;
  }

  input:disabled {
    opacity: 0.6;
  }

  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input-wrapper input {
    padding-right: 44px;
  }

  .password-toggle {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .password-toggle:hover:not(:disabled) {
    color: #00e701;
  }

  .password-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .success-message {
    text-align: center;
    padding: 24px 0;
  }

  .success-icon {
    width: 64px;
    height: 64px;
    background: rgba(0, 231, 1, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #00e701;
  }

  .success-message p {
    color: #00e701;
    font-size: 1.1em;
    font-weight: 500;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
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
