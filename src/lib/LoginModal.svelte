<script lang="ts">
  import { LogIn, Mail, Lock, Wallet, Link, Eye, EyeOff } from 'lucide-svelte';
  import { t, setLanguage, type Language } from '$lib/i18n';
  import { playerAuth, isPlayerLoggedIn } from '$lib/stores/playerAuth';
  import TwoFactorModal from '$lib/TwoFactorModal.svelte';

  let {
    show = $bindable(false),
    onSwitchToRegister,
  }: {
    show: boolean;
    onSwitchToRegister?: () => void;
  } = $props();

  type LoginMode = 'select' | 'email' | 'metamask-link';

  // Form state
  let loginMode = $state<LoginMode>('select');
  let email = $state('');
  let password = $state('');
  let submitting = $state(false);
  let error = $state('');
  let metamaskAddress = $state('');
  let linkPassword = $state('');
  let linkEmail = $state('');
  let showPassword = $state(false);
  let showLinkPassword = $state(false);

  // 2FA state
  let show2FA = $state(false);
  let twoFactorUserId = $state('');
  let twoFactorEmail = $state('');

  // Check if metamask is available
  let hasMetamask = $state(false);

  $effect(() => {
    if (typeof window !== 'undefined') {
      hasMetamask = !!(window as Window & { ethereum?: unknown }).ethereum;
    }
  });

  function close(): void {
    show = false;
    loginMode = 'select';
    email = '';
    password = '';
    linkEmail = '';
    linkPassword = '';
    error = '';
    metamaskAddress = '';
    showPassword = false;
    showLinkPassword = false;
    show2FA = false;
    twoFactorUserId = '';
    twoFactorEmail = '';
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  async function connectMetamask(): Promise<string | null> {
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!ethereum) {
      error = $t.authModal.metamaskNotFound;
      return null;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
      return null;
    } catch {
      error = $t.authModal.metamaskError;
      return null;
    }
  }

  async function handleMetamaskLogin(): Promise<void> {
    submitting = true;
    error = '';

    const address = await connectMetamask();
    if (!address) {
      submitting = false;
      return;
    }

    metamaskAddress = address;

    try {
      const response = await fetch('/api/player/login/metamask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metamaskAddress: address })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'WALLET_NOT_LINKED') {
          // Wallet not linked, show link form
          loginMode = 'metamask-link';
          submitting = false;
          return;
        }
        error = data.error || $t.authModal.loginError;
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

  async function handleEmailLogin(): Promise<void> {
    if (!email.trim() || !password) {
      error = $t.authModal.fillAllFields;
      return;
    }

    submitting = true;
    error = '';

    try {
      const response = await fetch('/api/player/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.authModal.loginError;
        submitting = false;
        return;
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        twoFactorUserId = data.userId;
        twoFactorEmail = data.email;
        show2FA = true;
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

  async function handleLinkMetamask(): Promise<void> {
    if (!linkEmail.trim() || !linkPassword) {
      error = $t.authModal.fillAllFields;
      return;
    }

    submitting = true;
    error = '';

    try {
      // First login to verify credentials
      const loginResponse = await fetch('/api/player/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: linkEmail.trim().toLowerCase(),
          password: linkPassword
        })
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        error = loginData.error || $t.authModal.loginError;
        submitting = false;
        return;
      }

      // Now link the metamask address
      const linkResponse = await fetch('/api/player/link-metamask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({ metamaskAddress })
      });

      const linkData = await linkResponse.json();

      if (!linkResponse.ok) {
        error = linkData.error || $t.authModal.linkError;
        submitting = false;
        return;
      }

      // Update user with new metamask address and login
      const updatedUser = { ...loginData.user, metamaskAddress };
      playerAuth.login(loginData.token, updatedUser);
      // Set language from user preference
      if (loginData.user.preferredLanguage) {
        setLanguage(loginData.user.preferredLanguage as Language);
      }
      close();
    } catch {
      error = $t.authModal.connectionError;
    } finally {
      submitting = false;
    }
  }

  async function handleSkipLinking(): Promise<void> {
    submitting = true;
    error = '';

    try {
      // Create a new MetaMask-only account
      const response = await fetch('/api/player/login/metamask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metamaskAddress, createIfNotExists: true })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || $t.authModal.loginError;
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

  function switchToRegister(): void {
    close();
    if (onSwitchToRegister) {
      onSwitchToRegister();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !submitting) {
      if (loginMode === 'email') {
        handleEmailLogin();
      } else if (loginMode === 'metamask-link') {
        handleLinkMetamask();
      }
    } else if (event.key === 'Escape') {
      if (loginMode !== 'select') {
        loginMode = 'select';
        error = '';
      } else {
        close();
      }
    }
  }

  function handle2FACancel(): void {
    show2FA = false;
    twoFactorUserId = '';
    twoFactorEmail = '';
    // Keep email/password in form so user can try again
  }

  function handle2FASuccess(): void {
    close();
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      {#if loginMode === 'select'}
        <!-- Login Method Selection -->
        <div class="modal-header">
          <LogIn size={24} />
          <span>{$t.authModal.loginTitle}</span>
        </div>

        <div class="login-options">
          <button
            class="option-btn metamask"
            onclick={handleMetamaskLogin}
            disabled={submitting || !hasMetamask}
          >
            <Wallet size={24} />
            <span>{$t.authModal.loginWithMetamask}</span>
          </button>

          {#if !hasMetamask}
            <p class="metamask-hint">{$t.authModal.installMetamask}</p>
          {/if}

          <div class="divider">
            <span>{$t.authModal.or}</span>
          </div>

          <button
            class="option-btn email"
            onclick={() => loginMode = 'email'}
            disabled={submitting}
          >
            <Mail size={24} />
            <span>{$t.authModal.loginWithEmail}</span>
          </button>
        </div>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="switch-mode">
          <span>{$t.authModal.noAccount}</span>
          <button class="link-btn" onclick={switchToRegister}>{$t.authModal.registerHere}</button>
        </div>

      {:else if loginMode === 'email'}
        <!-- Email Login Form -->
        <div class="modal-header">
          <Mail size={24} />
          <span>{$t.authModal.loginWithEmail}</span>
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

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="buttons">
          <button class="submit-btn" onclick={handleEmailLogin} disabled={submitting}>
            {submitting ? $t.authModal.loggingIn : $t.authModal.login}
          </button>
          <button class="cancel-btn" onclick={() => { loginMode = 'select'; error = ''; }}>
            {$t.authModal.back}
          </button>
        </div>

      {:else if loginMode === 'metamask-link'}
        <!-- Link Metamask to Existing Account -->
        <div class="modal-header">
          <Link size={24} />
          <span>{$t.authModal.linkWallet}</span>
        </div>

        <p class="link-info">{$t.authModal.linkWalletInfo}</p>

        <div class="wallet-address">
          <Wallet size={16} />
          <span>{metamaskAddress.slice(0, 6)}...{metamaskAddress.slice(-4)}</span>
        </div>

        <div class="form-group">
          <label>
            <Mail size={16} />
            <span>{$t.authModal.email}</span>
          </label>
          <input
            type="email"
            bind:value={linkEmail}
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
              type={showLinkPassword ? 'text' : 'password'}
              bind:value={linkPassword}
              placeholder={$t.authModal.passwordPlaceholder}
              onkeydown={handleKeydown}
              disabled={submitting}
            />
            <button
              type="button"
              class="password-toggle"
              onclick={() => showLinkPassword = !showLinkPassword}
              disabled={submitting}
              tabindex={-1}
            >
              {#if showLinkPassword}
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
          <button class="submit-btn" onclick={handleLinkMetamask} disabled={submitting}>
            {submitting ? $t.authModal.linking : $t.authModal.linkAndLogin}
          </button>
          <button class="skip-btn" onclick={handleSkipLinking} disabled={submitting}>
            {$t.authModal.skipLinking}
          </button>
          <button class="cancel-btn" onclick={() => { loginMode = 'select'; error = ''; }}>
            {$t.authModal.back}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<TwoFactorModal
  bind:show={show2FA}
  userId={twoFactorUserId}
  email={twoFactorEmail}
  onCancel={handle2FACancel}
/>

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

  .login-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .option-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    font-size: 1.1em;
    font-weight: 600;
    border: 2px solid;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .option-btn.metamask {
    background: linear-gradient(135deg, #f6851b22, #e2761b22);
    border-color: #f6851b;
    color: #f6851b;
  }

  .option-btn.metamask:hover:not(:disabled) {
    background: linear-gradient(135deg, #f6851b33, #e2761b33);
    transform: scale(1.02);
  }

  .option-btn.email {
    background: linear-gradient(135deg, #00bfff22, #0099cc22);
    border-color: #00bfff;
    color: #00bfff;
  }

  .option-btn.email:hover:not(:disabled) {
    background: linear-gradient(135deg, #00bfff33, #0099cc33);
    transform: scale(1.02);
  }

  .option-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .metamask-hint {
    color: #888;
    font-size: 0.85em;
    text-align: center;
    margin: -8px 0 0 0;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #666;
    font-size: 0.9em;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #2d4a5e;
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

  .link-info {
    color: #b1bad3;
    font-size: 0.9em;
    text-align: center;
    margin-bottom: 16px;
    line-height: 1.4;
  }

  .wallet-address {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba(246, 133, 27, 0.1);
    border: 1px solid #f6851b;
    border-radius: 8px;
    color: #f6851b;
    font-family: monospace;
    margin-bottom: 16px;
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

  .skip-btn {
    padding: 12px;
    font-size: 1em;
    width: 100%;
    background: linear-gradient(#f6851b, #e2761b);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .skip-btn:hover:not(:disabled) {
    transform: scale(1.02);
  }

  .skip-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .skip-btn:disabled {
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
