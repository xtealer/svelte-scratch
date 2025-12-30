<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { LogIn, User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-svelte';
  import Footer from '$lib/Footer.svelte';
  import { initLanguage, t, direction } from '$lib/i18n';

  let username = $state('');
  let showPassword = $state(false);
  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  let checkingAuth = $state(true);

  onMount(async () => {
    initLanguage();
    // Check if already logged in
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (data.authenticated) {
        goto('/admin/dashboard');
      }
    } catch {
      // Not logged in
    }
    checkingAuth = false;
  });

  async function handleLogin(e: Event) {
    e.preventDefault();
    error = '';
    loading = true;

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Login failed';
        loading = false;
        return;
      }

      goto('/admin/dashboard');
    } catch {
      error = 'Connection error';
      loading = false;
    }
  }
</script>

<div class="login-container" dir={$direction}>
  {#if checkingAuth}
    <div class="loading">{$t.common.loading}</div>
  {:else}
    <div class="login-box">
      <div class="login-header">
        <LogIn size={40} />
        <h1>{$t.common.casinoAdmin}</h1>
      </div>

      <form onsubmit={handleLogin}>
        {#if error}
          <div class="error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        {/if}

        <div class="input-group">
          <User size={20} />
          <input
            type="text"
            bind:value={username}
            placeholder="Username"
            required
            disabled={loading}
          />
        </div>

        <div class="input-group">
          <Lock size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            bind:value={password}
            placeholder="Password"
            required
            disabled={loading}
          />
          <button
            type="button"
            class="toggle-password"
            onclick={() => showPassword = !showPassword}
            tabindex={-1}
          >
            {#if showPassword}
              <EyeOff size={20} />
            {:else}
              <Eye size={20} />
            {/if}
          </button>
        </div>

        <button type="submit" class="login-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <a href="/" class="back-link">Back to Games</a>
    </div>
  {/if}
  <Footer />
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
    padding: 20px;
  }

  .login-container[dir="rtl"] {
    direction: rtl;
  }

  .loading {
    color: #ffd700;
    font-size: 1.2em;
  }

  .login-box {
    background: rgba(30, 30, 50, 0.9);
    border: 2px solid #ffd700;
    border-radius: 16px;
    padding: 40px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;
    color: #ffd700;
  }

  .login-header h1 {
    margin: 10px 0 0 0;
    font-size: 1.8em;
  }

  .login-header :global(svg) {
    color: #ffd700;
  }

  .error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    color: #ff6666;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 0.9em;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    transition: border-color 0.2s;
  }

  .input-group:focus-within {
    border-color: #ffd700;
  }

  .input-group :global(svg) {
    color: #888;
    flex-shrink: 0;
  }

  .input-group input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 1em;
    outline: none;
  }

  .input-group input::placeholder {
    color: #666;
  }

  .toggle-password {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #888;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }

  .toggle-password:hover {
    color: #ffd700;
  }

  .login-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
    color: #000;
    border: none;
    border-radius: 8px;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.1s, opacity 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    transform: scale(1.02);
  }

  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .back-link {
    display: block;
    text-align: center;
    margin-top: 20px;
    color: #888;
    text-decoration: none;
    font-size: 0.9em;
  }

  .back-link:hover {
    color: #ffd700;
  }
</style>
