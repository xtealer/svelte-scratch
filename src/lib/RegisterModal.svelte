<script lang="ts">
  import { ChevronDown, UserPlus, Mail, User, Lock, Globe, Languages, Eye, EyeOff } from 'lucide-svelte';
  import { t, currentLanguage, setLanguage, type Language } from '$lib/i18n';
  import { playerAuth } from '$lib/stores/playerAuth';
  import type { SupportedLanguage } from '$lib/server/db/types';

  let {
    show = $bindable(false),
    onSwitchToLogin,
  }: {
    show: boolean;
    onSwitchToLogin?: () => void;
  } = $props();

  // Country list for dropdown
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'MX', name: 'México' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'HN', name: 'Honduras' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'PA', name: 'Panamá' },
    { code: 'CO', name: 'Colombia' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'PE', name: 'Perú' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'CL', name: 'Chile' },
    { code: 'AR', name: 'Argentina' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'BR', name: 'Brasil' },
    { code: 'ES', name: 'España' },
    { code: 'DO', name: 'República Dominicana' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'CU', name: 'Cuba' },
  ];

  // Languages
  const languages: { code: SupportedLanguage; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'ar', name: 'العربية' },
  ];

  // Form state
  let email = $state('');
  let fullName = $state('');
  let country = $state('US');
  let preferredLanguage = $state<SupportedLanguage>($currentLanguage as SupportedLanguage);
  let password = $state('');
  let confirmPassword = $state('');
  let submitting = $state(false);
  let error = $state('');
  let success = $state(false);
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);

  function close(): void {
    show = false;
    email = '';
    fullName = '';
    password = '';
    confirmPassword = '';
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

  function validateForm(): boolean {
    error = '';

    if (!email.trim() || !email.includes('@')) {
      error = $t.authModal.emailError;
      return false;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      error = $t.authModal.nameError;
      return false;
    }

    if (!password || password.length < 6) {
      error = $t.authModal.passwordError;
      return false;
    }

    if (password !== confirmPassword) {
      error = $t.authModal.passwordMismatch;
      return false;
    }

    return true;
  }

  async function handleSubmit(): Promise<void> {
    if (!validateForm()) return;

    submitting = true;
    error = '';

    try {
      const response = await fetch('/api/player/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          country,
          preferredLanguage,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.authModal.registerError;
        submitting = false;
        return;
      }

      // Login the user with the returned token
      playerAuth.login(data.token, data.user);
      // Set language from user preference
      if (data.user.preferredLanguage) {
        setLanguage(data.user.preferredLanguage as Language);
      }
      success = true;
      submitting = false;

      // Close after brief delay
      setTimeout(() => {
        close();
      }, 1500);
    } catch {
      error = $t.authModal.connectionError;
      submitting = false;
    }
  }

  function switchToLogin(): void {
    close();
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !submitting) {
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
        <div class="success-view">
          <div class="success-icon">
            <UserPlus size={40} />
          </div>
          <div class="modal-header success">{$t.authModal.registerSuccess}</div>
          <p class="success-message">{$t.authModal.welcomeMessage}</p>
        </div>
      {:else}
        <div class="modal-header">
          <UserPlus size={24} />
          <span>{$t.authModal.registerTitle}</span>
        </div>

        <div class="form-group">
          <label>
            <Mail size={16} />
            <span>{$t.authModal.email} <span class="required">*</span></span>
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
            <User size={16} />
            <span>{$t.authModal.fullName} <span class="required">*</span></span>
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
            <Globe size={16} />
            <span>{$t.authModal.country} <span class="required">*</span></span>
          </label>
          <div class="select-wrapper">
            <select bind:value={country} disabled={submitting}>
              {#each countries as c}
                <option value={c.code}>{c.name}</option>
              {/each}
            </select>
            <ChevronDown size={16} class="select-icon" />
          </div>
        </div>

        <div class="form-group">
          <label>
            <Languages size={16} />
            <span>{$t.authModal.language} <span class="required">*</span></span>
          </label>
          <div class="select-wrapper">
            <select bind:value={preferredLanguage} disabled={submitting}>
              {#each languages as lang}
                <option value={lang.code}>{lang.name}</option>
              {/each}
            </select>
            <ChevronDown size={16} class="select-icon" />
          </div>
        </div>

        <div class="form-group">
          <label>
            <Lock size={16} />
            <span>{$t.authModal.password} <span class="required">*</span></span>
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
            <span>{$t.authModal.confirmPassword} <span class="required">*</span></span>
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
          <button class="submit-btn" onclick={handleSubmit} disabled={submitting}>
            {submitting ? $t.authModal.registering : $t.authModal.register}
          </button>
          <button class="cancel-btn" onclick={close} disabled={submitting}>
            {$t.authModal.cancel}
          </button>
        </div>

        <div class="switch-mode">
          <span>{$t.authModal.haveAccount}</span>
          <button class="link-btn" onclick={switchToLogin}>{$t.authModal.loginHere}</button>
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
    color: #00e701;
  }

  .success-view {
    text-align: center;
    padding: 20px 0;
  }

  .success-icon {
    color: #00e701;
    margin-bottom: 16px;
  }

  .success-message {
    color: #b1bad3;
    font-size: 0.95em;
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

  .required {
    color: #ff6b6b;
  }

  input, select {
    width: 100%;
    padding: 12px;
    font-size: 1em;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 8px;
    color: #fff;
  }

  input:focus, select:focus {
    outline: none;
    border-color: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.2);
  }

  input::placeholder {
    color: #666;
  }

  input:disabled, select:disabled {
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

  .select-wrapper {
    position: relative;
  }

  .select-wrapper select {
    appearance: none;
    padding-right: 36px;
    cursor: pointer;
  }

  .select-wrapper :global(.select-icon) {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
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

  .switch-mode {
    margin-top: 20px;
    text-align: center;
    color: #b1bad3;
    font-size: 0.9em;
  }

  .link-btn {
    background: none;
    border: none;
    color: #00e701;
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
    padding: 0;
    margin-left: 4px;
  }

  .link-btn:hover {
    color: #00ff00;
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 24px 20px;
    }
  }
</style>
