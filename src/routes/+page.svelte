<script lang="ts">
  import { onMount } from "svelte";
  import { Ticket, Dices, Gamepad2 } from "lucide-svelte";
  import Footer from "$lib/Footer.svelte";
  import GameNavbar from "$lib/GameNavbar.svelte";
  import ScratchCodeModal from "$lib/ScratchCodeModal.svelte";
  import DepositModal from "$lib/DepositModal.svelte";
  import LoginModal from "$lib/LoginModal.svelte";
  import RegisterModal from "$lib/RegisterModal.svelte";
  import ProfileModal from "$lib/ProfileModal.svelte";
  import { initLanguage, direction, t } from "$lib/i18n";
  import { playerWallet } from "$lib/stores/playerWallet";

  interface RecentPlay {
    id: string;
    game: string;
    time: string;
    betAmount: number;
    payout: number;
    multiplier: string;
    isWin: boolean;
    user: string;
  }

  let showCodeModal = $state(false);
  let showDepositModal = $state(false);
  let showLoginModal = $state(false);
  let showRegisterModal = $state(false);
  let showProfileModal = $state(false);
  let recentPlays = $state<RecentPlay[]>([]);
  let loadingPlays = $state(true);

  onMount(() => {
    initLanguage();
    fetchRecentPlays();
    // Refresh plays every 10 seconds
    const interval = setInterval(fetchRecentPlays, 10000);
    return () => clearInterval(interval);
  });

  async function fetchRecentPlays() {
    try {
      const response = await fetch('/api/plays/recent?limit=10');
      const data = await response.json();
      recentPlays = data.plays || [];
    } catch (error) {
      console.error('Failed to fetch recent plays:', error);
    } finally {
      loadingPlays = false;
    }
  }

  function closeAllModals() {
    showCodeModal = false;
    showDepositModal = false;
    showLoginModal = false;
    showRegisterModal = false;
    showProfileModal = false;
  }

  function openCodeModal() {
    closeAllModals();
    showCodeModal = true;
  }

  function openDepositModal() {
    closeAllModals();
    showDepositModal = true;
  }

  function openLoginModal() {
    closeAllModals();
    showLoginModal = true;
  }

  function openRegisterModal() {
    closeAllModals();
    showRegisterModal = true;
  }

  function openProfileModal() {
    closeAllModals();
    showProfileModal = true;
  }

  function switchToRegister() {
    showLoginModal = false;
    showRegisterModal = true;
  }

  function switchToLogin() {
    showRegisterModal = false;
    showLoginModal = true;
  }

  async function handleCodeSubmit(code: string): Promise<void> {
    const response = await fetch("/api/scratch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Invalid code");
    }

    playerWallet.loadCode(data.code, data.plays, data.totalWinnings || 0);
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getGameIcon(gameId: string): string {
    const icons: Record<string, string> = {
      scratch: '🎫',
      slots: '🎰'
    };
    return icons[gameId] || '🎮';
  }

  function getGameName(gameId: string): string {
    const names: Record<string, string> = {
      scratch: $t.gameMenu.scratchTitle,
      slots: $t.gameMenu.slotsTitle
    };
    return names[gameId] || gameId;
  }
</script>

<GameNavbar onEnterCode={openCodeModal} onDeposit={openDepositModal} onLogin={openLoginModal} onRegister={openRegisterModal} onProfile={openProfileModal} />

<div class="page" dir={$direction}>
  <main class="container">
    <!-- Games Section -->
    <section class="section">
      <div class="section-header">
        <Gamepad2 size={20} />
        <h2>{$t.gameMenu.ourGames}</h2>
      </div>

      <div class="games-grid">
        <!-- Scratch Card -->
        <a href="/scratch" class="game-card">
          <div class="game-image scratch-bg">
            <Ticket size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">{$t.gameMenu.scratchTitle}</div>
            <div class="game-desc">{$t.gameMenu.scratchDesc}</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Slots -->
        <a href="/slots" class="game-card">
          <div class="game-image slots-bg">
            <Dices size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">{$t.gameMenu.slotsTitle}</div>
            <div class="game-desc">{$t.gameMenu.slotsDesc}</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>
      </div>
    </section>

    <!-- All Bets Section -->
    <section class="section">
      <div class="section-header">
        <span class="bets-icon">📊</span>
        <h2>{$t.gameMenu.allBets}</h2>
      </div>

      <div class="bets-table-container">
        <table class="bets-table">
          <thead>
            <tr>
              <th>{$t.gameMenu.game}</th>
              <th>{$t.gameMenu.user}</th>
              <th>{$t.gameMenu.time}</th>
              <th>{$t.gameMenu.betAmount}</th>
              <th>{$t.gameMenu.multiplier}</th>
              <th>{$t.gameMenu.payout}</th>
            </tr>
          </thead>
          <tbody>
            {#if loadingPlays}
              <tr>
                <td colspan="6" class="loading-cell">{$t.common.loading}</td>
              </tr>
            {:else if recentPlays.length === 0}
              <tr>
                <td colspan="6" class="empty-cell">{$t.gameMenu.noBetsYet}</td>
              </tr>
            {:else}
              {#each recentPlays as play}
                <tr class:win-row={play.isWin}>
                  <td class="game-cell">
                    <span class="game-icon">{getGameIcon(play.game)}</span>
                    <span class="game-label">{getGameName(play.game)}</span>
                  </td>
                  <td class="user-cell">{play.user}</td>
                  <td class="time-cell">{formatTime(play.time)}</td>
                  <td class="bet-cell">${play.betAmount.toFixed(2)}</td>
                  <td class="multiplier-cell" class:win-multiplier={play.isWin}>
                    {#if play.isWin && parseFloat(play.multiplier) >= 10}
                      <span class="fire">🔥</span>
                    {/if}
                    {play.multiplier}x
                  </td>
                  <td class="payout-cell" class:win-payout={play.isWin} class:loss-payout={!play.isWin}>
                    {play.isWin ? '+' : '-'}${play.isWin ? play.payout.toFixed(2) : play.betAmount.toFixed(2)}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <Footer />
</div>

<ScratchCodeModal bind:show={showCodeModal} onCodeSubmit={handleCodeSubmit} />
<DepositModal bind:show={showDepositModal} onCodeSubmit={handleCodeSubmit} />
<LoginModal bind:show={showLoginModal} onSwitchToRegister={switchToRegister} />
<RegisterModal bind:show={showRegisterModal} onSwitchToLogin={switchToLogin} />
<ProfileModal bind:show={showProfileModal} />

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
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px;
    padding-top: max(70px, calc(env(safe-area-inset-top) + 60px));
  }

  .section {
    margin-bottom: 32px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: #fff;
  }

  .section-header h2 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 0;
  }

  .section-header :global(svg) {
    color: #00e701;
  }

  .bets-icon {
    font-size: 1.2em;
  }

  /* Games Grid */
  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    max-width: 600px;
  }

  .game-card {
    background: #1a2c38;
    border-radius: 12px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
  }

  .game-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 231, 1, 0.15);
  }

  .game-card:active {
    transform: scale(0.98);
  }

  .game-image {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .game-image :global(svg) {
    color: rgba(255, 255, 255, 0.9);
    z-index: 1;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .scratch-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .slots-bg {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .game-info {
    padding: 12px;
    flex: 1;
  }

  .game-name {
    font-size: 1.1em;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }

  .game-desc {
    font-size: 0.85em;
    color: #7f8c8d;
    margin-bottom: 8px;
  }

  .game-prize {
    font-size: 0.75em;
    color: #00e701;
    background: rgba(0, 231, 1, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .play-btn {
    width: 100%;
    padding: 12px;
    background: #00e701;
    color: #0f1923;
    border: none;
    font-weight: 700;
    font-size: 0.9em;
    cursor: pointer;
    transition: background 0.2s;
  }

  .play-btn:hover {
    background: #00c700;
  }

  /* Bets Table */
  .bets-table-container {
    background: #1a2c38;
    border-radius: 12px;
    overflow: hidden;
  }

  .bets-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
  }

  .bets-table th {
    background: #213743;
    color: #7f8c8d;
    font-weight: 500;
    text-align: left;
    padding: 12px 16px;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .bets-table td {
    padding: 12px 16px;
    color: #b1bad3;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .bets-table tbody tr:last-child td {
    border-bottom: none;
  }

  .bets-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .win-row {
    background: rgba(0, 231, 1, 0.08);
  }

  .win-row:hover {
    background: rgba(0, 231, 1, 0.12);
  }

  .game-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .game-icon {
    font-size: 1.1em;
  }

  .game-label {
    color: #fff;
    font-weight: 500;
  }

  .user-cell {
    color: #7f8c8d;
  }

  .time-cell {
    color: #7f8c8d;
  }

  .bet-cell {
    color: #fff;
  }

  .multiplier-cell {
    color: #7f8c8d;
  }

  .win-multiplier {
    color: #00e701;
    font-weight: 700;
    text-shadow: 0 0 8px rgba(0, 231, 1, 0.5);
  }

  .fire {
    margin-right: 4px;
  }

  .payout-cell {
    font-weight: 600;
  }

  .payout-cell.win-payout {
    color: #00e701;
    text-shadow: 0 0 8px rgba(0, 231, 1, 0.5);
  }

  .payout-cell.loss-payout {
    color: #ff4444;
    text-shadow: 0 0 8px rgba(255, 68, 68, 0.3);
  }

  .loading-cell,
  .empty-cell {
    text-align: center;
    padding: 32px !important;
    color: #7f8c8d;
  }

  /* Mobile Styles */
  @media (max-width: 600px) {
    .container {
      padding: 12px;
      padding-top: max(60px, calc(env(safe-area-inset-top) + 52px));
    }

    .games-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .game-image :global(svg) {
      width: 48px;
      height: 48px;
    }

    .game-info {
      padding: 10px;
    }

    .game-name {
      font-size: 1em;
    }

    .game-desc {
      font-size: 0.8em;
    }

    .play-btn {
      padding: 10px;
      font-size: 0.85em;
    }

    /* Responsive table */
    .bets-table {
      font-size: 0.8em;
    }

    .bets-table th,
    .bets-table td {
      padding: 10px 8px;
    }

    /* Hide some columns on mobile */
    .bets-table th:nth-child(2),
    .bets-table td:nth-child(2),
    .bets-table th:nth-child(3),
    .bets-table td:nth-child(3) {
      display: none;
    }
  }

  @media (max-width: 380px) {
    .games-grid {
      gap: 8px;
    }

    .game-image :global(svg) {
      width: 40px;
      height: 40px;
    }

    .game-info {
      padding: 8px;
    }

    .game-name {
      font-size: 0.9em;
    }

    .game-prize {
      font-size: 0.7em;
      padding: 3px 6px;
    }

    .play-btn {
      padding: 8px;
      font-size: 0.8em;
    }

    .bets-table th:nth-child(5),
    .bets-table td:nth-child(5) {
      display: none;
    }
  }
</style>
