<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { User, Mail, Lock, Wallet, Eye, EyeOff, Link, ArrowLeft, Check, Globe } from 'lucide-svelte';
  import { t, initLanguage, direction, setLanguage, getSupportedLanguages, currentLanguage, type Language } from '$lib/i18n';
  import { playerAuth, isPlayerLoggedIn, playerUser } from '$lib/stores/playerAuth';
  import GameNavbar from '$lib/GameNavbar.svelte';
  import Footer from '$lib/Footer.svelte';

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

  // Language state
  let savingLanguage = $state(false);
  let languageSaved = $state(false);
  let selectedLanguage = $state<Language>('en');

  // Check if user is MetaMask-only (no email linked)
  let isMetamaskOnly = $derived($playerUser?.metamaskAddress && !$playerUser?.email);

  // Available languages
  const languages = getSupportedLanguages();

  onMount(() => {
    initLanguage();
    // Initialize selected language from user profile or current language
    selectedLanguage = ($playerUser?.preferredLanguage as Language) || $currentLanguage;
    // Redirect to home if not logged in
    if (!$isPlayerLoggedIn) {
      goto('/');
    }
  });

  // Also watch for auth changes
  $effect(() => {
    if (!$isPlayerLoggedIn) {
      goto('/');
    }
  });

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

      // Reset form
      email = '';
      password = '';
      confirmPassword = '';
      fullName = '';
    } catch {
      error = $t.authModal.connectionError;
    } finally {
      submitting = false;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !submitting && isMetamaskOnly && !success) {
      handleLinkEmail();
    }
  }

  async function handleLanguageChange(lang: Language): Promise<void> {
    if (lang === selectedLanguage || savingLanguage) return;

    selectedLanguage = lang;
    savingLanguage = true;
    languageSaved = false;

    try {
      const token = localStorage.getItem('goldGames_playerToken');
      if (!token) {
        // Just set the language locally if not logged in
        setLanguage(lang);
        savingLanguage = false;
        return;
      }

      const response = await fetch('/api/player/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferredLanguage: lang })
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state and auth store
        setLanguage(lang);
        playerAuth.login(data.token, data.user);
        languageSaved = true;
        setTimeout(() => {
          languageSaved = false;
        }, 2000);
      }
    } catch {
      // Fallback to just setting local language
      setLanguage(lang);
    } finally {
      savingLanguage = false;
    }
  }
</script>

<GameNavbar />

<div class="page" dir={$direction}>
  <main class="container">
    <div class="back-link">
      <a href="/">
        <ArrowLeft size={20} />
        <span>{$t.common.backToHome}</span>
      </a>
    </div>

    <div class="profile-card">
      <div class="profile-header">
        <User size={28} />
        <h1>{$t.profile.title}</h1>
      </div>

      <!-- User Info Section -->
      <div class="user-info-section">
        <h2 class="section-title">{$t.profile.accountInfo}</h2>

        <div class="info-row">
          <User size={18} />
          <span class="info-label">{$t.authModal.fullName}:</span>
          <span class="info-value">{$playerUser?.fullName || '-'}</span>
        </div>

        {#if $playerUser?.email}
          <div class="info-row">
            <Mail size={18} />
            <span class="info-label">{$t.authModal.email}:</span>
            <span class="info-value">{$playerUser.email}</span>
          </div>
        {/if}

        {#if $playerUser?.metamaskAddress}
          <div class="info-row">
            <Wallet size={18} />
            <span class="info-label">{$t.profile.wallet}:</span>
            <span class="info-value wallet-address">
              {$playerUser.metamaskAddress.slice(0, 6)}...{$playerUser.metamaskAddress.slice(-4)}
            </span>
          </div>
        {/if}
      </div>

      <!-- Language Preference Section -->
      <div class="language-section">
        <div class="section-header-lang">
          <Globe size={20} />
          <h2>{$t.profile.preferredLanguage}</h2>
          {#if languageSaved}
            <span class="saved-badge">
              <Check size={14} />
              {$t.profile.languageSaved}
            </span>
          {:else if savingLanguage}
            <span class="saving-badge">{$t.profile.savingLanguage}</span>
          {/if}
        </div>

        <div class="language-options">
          {#each languages as lang}
            <button
              class="language-btn"
              class:active={selectedLanguage === lang.code}
              onclick={() => handleLanguageChange(lang.code)}
              disabled={savingLanguage}
            >
              <span class="lang-native">{lang.nativeLabel}</span>
              <span class="lang-label">{lang.label}</span>
            </button>
          {/each}
        </div>
      </div>

      {#if isMetamaskOnly && !success}
        <!-- Link Email Section for MetaMask-only accounts -->
        <div class="link-email-section">
          <div class="section-header">
            <Link size={20} />
            <h2>{$t.profile.linkEmailTitle}</h2>
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

          <button class="submit-btn" onclick={handleLinkEmail} disabled={submitting}>
            {submitting ? $t.authModal.linking : $t.profile.linkEmail}
          </button>
        </div>
      {/if}

      {#if success}
        <div class="success-message">
          <div class="success-icon">
            <Check size={32} />
          </div>
          <p>{$t.profile.emailLinkedSuccess}</p>
        </div>
      {/if}
    </div>
  </main>

  <Footer />
</div>

<style>
  .page {
    min-height: 100vh;
    min-height: 100dvh;
    background: #0f1923;
    display: flex;
    flex-direction: column;
  }

  .container {
    flex: 1;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 16px;
    padding-top: max(70px, calc(env(safe-area-inset-top) + 60px));
  }

  .back-link {
    margin-bottom: 20px;
  }

  .back-link a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #b1bad3;
    text-decoration: none;
    font-size: 0.95em;
    transition: color 0.2s;
  }

  .back-link a:hover {
    color: #00e701;
  }

  .profile-card {
    background: linear-gradient(#1a2c38, #213743);
    border: 2px solid #2d4a5e;
    border-radius: 16px;
    padding: 24px;
  }

  .profile-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
    color: #00e701;
  }

  .profile-header h1 {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 0 10px rgba(0, 231, 1, 0.5);
  }

  .profile-header :global(svg) {
    flex-shrink: 0;
  }

  .user-info-section {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 1em;
    color: #7f8c8d;
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
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
    font-size: 0.95em;
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

  .language-section {
    background: rgba(0, 191, 255, 0.1);
    border: 1px solid rgba(0, 191, 255, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .section-header-lang {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #00bfff;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .section-header-lang h2 {
    font-size: 1.15em;
    font-weight: 600;
    margin: 0;
  }

  .section-header-lang :global(svg) {
    flex-shrink: 0;
  }

  .saved-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    padding: 4px 10px;
    background: rgba(0, 231, 1, 0.2);
    border-radius: 20px;
    font-size: 0.8em;
    color: #00e701;
    font-weight: 500;
  }

  .saving-badge {
    margin-left: auto;
    font-size: 0.8em;
    color: #7f8c8d;
  }

  .language-options {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .language-btn {
    flex: 1;
    min-width: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #2d4a5e;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .language-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #00bfff;
  }

  .language-btn.active {
    background: rgba(0, 191, 255, 0.2);
    border-color: #00bfff;
  }

  .language-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .lang-native {
    font-size: 1.1em;
    font-weight: 600;
    color: #fff;
  }

  .lang-label {
    font-size: 0.8em;
    color: #7f8c8d;
  }

  .language-btn.active .lang-native {
    color: #00bfff;
  }

  .link-email-section {
    background: rgba(246, 133, 27, 0.1);
    border: 1px solid rgba(246, 133, 27, 0.3);
    border-radius: 12px;
    padding: 20px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #f6851b;
    margin-bottom: 12px;
  }

  .section-header h2 {
    font-size: 1.15em;
    font-weight: 600;
    margin: 0;
  }

  .link-info {
    color: #b1bad3;
    font-size: 0.9em;
    margin-bottom: 20px;
    line-height: 1.5;
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
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 14px;
    font-size: 1em;
    background: #0f1923;
    border: 2px solid #2d4a5e;
    border-radius: 10px;
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
    padding-right: 48px;
  }

  .password-toggle {
    position: absolute;
    right: 12px;
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
    padding: 12px;
    background: rgba(255, 68, 68, 0.1);
    border-radius: 8px;
  }

  .success-message {
    text-align: center;
    padding: 24px;
    background: rgba(0, 231, 1, 0.1);
    border: 1px solid rgba(0, 231, 1, 0.3);
    border-radius: 12px;
  }

  .success-icon {
    width: 64px;
    height: 64px;
    background: rgba(0, 231, 1, 0.15);
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
    margin: 0;
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
    margin-top: 8px;
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

  @media (max-width: 600px) {
    .container {
      padding: 12px;
      padding-top: max(60px, calc(env(safe-area-inset-top) + 52px));
    }

    .profile-card {
      padding: 16px;
    }

    .user-info-section,
    .link-email-section {
      padding: 16px;
    }
  }
</style>
