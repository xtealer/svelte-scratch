<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Gamepad2, ArrowLeft, ToggleLeft, ToggleRight, Save } from 'lucide-svelte';
  import Footer from '$lib/Footer.svelte';
  import { initLanguage, t, getDirection, type Translations } from '$lib/i18n';

  interface Game {
    gameId: string;
    name: string;
    enabled: boolean;
    description?: string;
    updatedAt: string;
  }

  let games = $state<Game[]>([]);
  let loading = $state(true);
  let saving = $state<string | null>(null);

  // i18n
  let i18n = $state<Translations>(t());
  let dir = $state<'ltr' | 'rtl'>('ltr');

  onMount(async () => {
    initLanguage();
    i18n = t();
    dir = getDirection();
    await checkAuth();
    await loadGames();
  });

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (!data.authenticated || data.user.role !== 'admin') {
        goto('/admin');
      }
    } catch {
      goto('/admin');
    }
  }

  async function loadGames() {
    loading = true;
    try {
      const res = await fetch('/api/admin/games');
      if (res.ok) {
        const data = await res.json();
        games = data.games;
      }
    } catch {
      // Handle error
    }
    loading = false;
  }

  async function toggleGame(game: Game) {
    saving = game.gameId;
    try {
      await fetch('/api/admin/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.gameId,
          enabled: !game.enabled
        })
      });
      await loadGames();
    } catch {
      // Handle error
    }
    saving = null;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }
</script>

<div class="admin-container" dir={dir}>
  <nav class="sidebar">
    <div class="sidebar-header">
      <h2>{i18n.common.casinoAdmin}</h2>
    </div>

    <ul class="nav-menu">
      <li>
        <a href="/admin/dashboard">
          <ArrowLeft size={20} />
          <span>{i18n.common.backToDashboard}</span>
        </a>
      </li>
    </ul>
  </nav>

  <main class="main-content">
    <header class="top-bar">
      <h1>
        <Gamepad2 size={28} />
        <span>{i18n.games.title}</span>
      </h1>
    </header>

    {#if loading}
      <div class="loading">{i18n.games.loading}</div>
    {:else}
      <div class="games-grid">
        {#each games as game}
          <div class="game-card" class:disabled={!game.enabled}>
            <div class="game-header">
              <h3>{game.name}</h3>
              <button
                class="toggle-btn"
                class:enabled={game.enabled}
                onclick={() => toggleGame(game)}
                disabled={saving === game.gameId}
              >
                {#if saving === game.gameId}
                  <Save size={20} class="spin" />
                {:else if game.enabled}
                  <ToggleRight size={24} />
                {:else}
                  <ToggleLeft size={24} />
                {/if}
              </button>
            </div>

            <p class="game-id">ID: {game.gameId}</p>

            {#if game.description}
              <p class="game-desc">{game.description}</p>
            {/if}

            <div class="game-footer">
              <span class="status" class:active={game.enabled}>
                {game.enabled ? i18n.games.active : i18n.games.disabled}
              </span>
              <span class="updated">{i18n.games.updated}: {formatDate(game.updatedAt)}</span>
            </div>
          </div>
        {/each}
      </div>

      <div class="info-box">
        <h4>{i18n.games.gameStatusInfo}</h4>
        <p>{i18n.games.whenDisabled}</p>
        <ul>
          <li>{i18n.games.cannotAccess}</li>
          <li>{i18n.games.existingSessions}</li>
          <li>{i18n.games.showMaintenance}</li>
        </ul>
      </div>
    {/if}

    <Footer />
  </main>
</div>

<style>
  .admin-container {
    display: flex;
    min-height: 100vh;
    background: #0f0f1a;
  }

  .admin-container[dir="rtl"] {
    direction: rtl;
  }

  .sidebar {
    width: 250px;
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border-right: 1px solid #333;
  }

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #333;
    text-align: center;
  }

  .sidebar-header h2 {
    margin: 0;
    color: #ffd700;
    font-size: 1.3em;
  }

  .nav-menu {
    list-style: none;
    padding: 10px 0;
    margin: 0;
  }

  .nav-menu li a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    color: #aaa;
    text-decoration: none;
    transition: all 0.2s;
  }

  .nav-menu li a:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 1200px) {
    .main-content {
      padding: 30px 40px;
    }
  }

  @media (min-width: 1600px) {
    .main-content {
      padding: 40px 60px;
    }
  }

  .top-bar {
    margin-bottom: 30px;
  }

  .top-bar h1 {
    margin: 0;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #888;
  }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
    flex: 1;
  }

  .game-card {
    background: rgba(30, 30, 50, 0.8);
    border: 2px solid #333;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s;
  }

  .game-card:not(.disabled) {
    border-color: #00cc00;
  }

  .game-card.disabled {
    opacity: 0.7;
  }

  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .game-header h3 {
    margin: 0;
    color: #fff;
    font-size: 1.3em;
  }

  .toggle-btn {
    width: 50px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    border-radius: 15px;
    color: #ff6666;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.enabled {
    background: rgba(0, 200, 0, 0.2);
    border-color: #00cc00;
    color: #00cc00;
  }

  .toggle-btn:disabled {
    cursor: wait;
  }

  .toggle-btn :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .game-id {
    color: #888;
    font-size: 0.85em;
    margin: 0 0 8px 0;
    font-family: monospace;
  }

  .game-desc {
    color: #aaa;
    font-size: 0.95em;
    margin: 0 0 16px 0;
  }

  .game-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #333;
  }

  .status {
    padding: 4px 12px;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    border-radius: 12px;
    color: #ff6666;
    font-size: 0.8em;
    text-transform: uppercase;
  }

  .status.active {
    background: rgba(0, 200, 0, 0.2);
    border-color: #00cc00;
    color: #00cc00;
  }

  .updated {
    color: #666;
    font-size: 0.8em;
  }

  .info-box {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid #ffd700;
    border-radius: 12px;
    padding: 20px;
  }

  .info-box h4 {
    margin: 0 0 12px 0;
    color: #ffd700;
  }

  .info-box p {
    margin: 0 0 8px 0;
    color: #aaa;
  }

  .info-box ul {
    margin: 0;
    padding-left: 20px;
    color: #888;
  }

  .info-box li {
    margin: 4px 0;
  }

  @media (max-width: 768px) {
    .admin-container {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #333;
    }

    .nav-menu {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      padding: 10px;
    }

    .nav-menu li a {
      padding: 10px 15px;
    }

    .nav-menu li a span {
      display: none;
    }

    .games-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (min-width: 1200px) {
    .games-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
  }

  @media (min-width: 1600px) {
    .games-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
