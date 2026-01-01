<script lang="ts">
  import { onMount } from "svelte";
  import { Ticket, Dices, Gamepad2, UserX, Target, Coins, CircleDot, TrendingUp, Bomb, Grid3X3, Car, Spade, Club, LayoutGrid } from "lucide-svelte";
  import Footer from "$lib/Footer.svelte";
  import GameNavbar from "$lib/GameNavbar.svelte";
  import ScratchCodeModal from "$lib/ScratchCodeModal.svelte";
  import DepositModal from "$lib/DepositModal.svelte";
  import WithdrawModal from "$lib/WithdrawModal.svelte";
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
  let showWithdrawModal = $state(false);
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
    showWithdrawModal = false;
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

  function openWithdrawModal() {
    closeAllModals();
    showWithdrawModal = true;
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
      slots: '🎰',
      dice: '🎲',
      limbo: '🚀',
      flip: '🪙',
      wheel: '🎡',
      crash: '📈',
      mines: '💎',
      keno: '🔢',
      chickenroad: '🐔',
      blackjack: '🃏',
      baccarat: '🎴',
      bingo: '🎱'
    };
    return icons[gameId] || '🎮';
  }

  function getGameName(gameId: string): string {
    const names: Record<string, string> = {
      scratch: $t.gameMenu.scratchTitle,
      slots: $t.gameMenu.slotsTitle,
      dice: $t.gameMenu.diceTitle || 'Dice',
      limbo: 'Limbo',
      flip: 'Flip',
      wheel: 'Wheel',
      crash: 'Crash',
      mines: 'Mines',
      keno: 'Keno',
      chickenroad: 'Chicken Road',
      blackjack: 'Blackjack',
      baccarat: 'Baccarat',
      bingo: 'Bingo'
    };
    return names[gameId] || gameId;
  }
</script>

<GameNavbar onEnterCode={openCodeModal} onDeposit={openDepositModal} onWithdraw={openWithdrawModal} onLogin={openLoginModal} onRegister={openRegisterModal} />

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

        <!-- Dice -->
        <a href="/dice" class="game-card">
          <div class="game-image dice-bg">
            <Target size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">{$t.gameMenu.diceTitle || 'Dice'}</div>
            <div class="game-desc">{$t.gameMenu.diceDesc || 'Roll the dice!'}</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Limbo -->
        <a href="/limbo" class="game-card">
          <div class="game-image limbo-bg">
            <TrendingUp size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Limbo</div>
            <div class="game-desc">Beat the multiplier!</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Flip -->
        <a href="/flip" class="game-card">
          <div class="game-image flip-bg">
            <Coins size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Flip</div>
            <div class="game-desc">Heads or tails?</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Wheel -->
        <a href="/wheel" class="game-card">
          <div class="game-image wheel-bg">
            <CircleDot size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Wheel</div>
            <div class="game-desc">Spin to win!</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Crash -->
        <a href="/crash" class="game-card">
          <div class="game-image crash-bg">
            <TrendingUp size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Crash</div>
            <div class="game-desc">Cash out before it crashes!</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Mines -->
        <a href="/mines" class="game-card">
          <div class="game-image mines-bg">
            <Bomb size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Mines</div>
            <div class="game-desc">Find the gems, avoid the mines!</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Keno -->
        <a href="/keno" class="game-card">
          <div class="game-image keno-bg">
            <Grid3X3 size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Keno</div>
            <div class="game-desc">Pick your lucky numbers!</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Chicken Road -->
        <a href="/chickenroad" class="game-card">
          <div class="game-image chickenroad-bg">
            <Car size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Chicken Road</div>
            <div class="game-desc">Cross the road safely!</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Blackjack -->
        <a href="/blackjack" class="game-card">
          <div class="game-image blackjack-bg">
            <Spade size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Blackjack</div>
            <div class="game-desc">Beat the dealer to 21!</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Baccarat -->
        <a href="/baccarat" class="game-card">
          <div class="game-image baccarat-bg">
            <Club size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Baccarat</div>
            <div class="game-desc">Player, Banker, or Tie?</div>
            <div class="game-prize">{$t.gameMenu.prizeText}</div>
          </div>
          <button class="play-btn">{$t.gameMenu.playNow}</button>
        </a>

        <!-- Bingo -->
        <a href="/bingo" class="game-card">
          <div class="game-image bingo-bg">
            <LayoutGrid size={64} strokeWidth={1.5} />
          </div>
          <div class="game-info">
            <div class="game-name">Bingo</div>
            <div class="game-desc">Match the numbers, win big!</div>
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
              <th class="th-game">{$t.gameMenu.game}</th>
              <th class="th-user">{$t.gameMenu.user}</th>
              <th class="th-time">{$t.gameMenu.time}</th>
              <th class="th-bet">{$t.gameMenu.betAmount}</th>
              <th class="th-multiplier">{$t.gameMenu.multiplier}</th>
              <th class="th-payout">{$t.gameMenu.payout}</th>
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
                  <td class="td-game">
                    <span class="game-cell">
                      <span class="game-icon">{getGameIcon(play.game)}</span>
                      <span class="game-label">{getGameName(play.game)}</span>
                    </span>
                  </td>
                  <td class="td-user">
                    <span class="user-cell">
                      <UserX size={16} class="hidden-user-icon" />
                      <span>Hidden</span>
                    </span>
                  </td>
                  <td class="td-time">{formatTime(play.time)}</td>
                  <td class="td-bet">
                    <span class="bet-cell">
                      <span class="amount-value">${play.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span class="currency-icon tether">T</span>
                    </span>
                  </td>
                  <td class="td-multiplier">
                    {play.multiplier}x
                  </td>
                  <td class="td-payout" class:win-payout={play.isWin} class:loss-payout={!play.isWin}>
                    <span class="payout-cell">
                      <span class="amount-value">{play.isWin ? '' : '-'}${play.isWin ? play.payout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : play.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span class="currency-icon tether">T</span>
                    </span>
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
<WithdrawModal bind:show={showWithdrawModal} />
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
    max-width: 900px;
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

  .dice-bg {
    background: linear-gradient(135deg, #00e701 0%, #007b00 100%);
  }

  .limbo-bg {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  .flip-bg {
    background: linear-gradient(135deg, #f7931a 0%, #c67600 100%);
  }

  .wheel-bg {
    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  }

  .crash-bg {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  }

  .mines-bg {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .keno-bg {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  }

  .chickenroad-bg {
    background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
  }

  .blackjack-bg {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  }

  .baccarat-bg {
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  }

  .bingo-bg {
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
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
    overflow-x: auto;
  }

  .bets-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
    table-layout: fixed;
  }

  .bets-table th {
    background: #0f212e;
    color: #7f8c8d;
    font-weight: 500;
    padding: 14px 16px;
    font-size: 0.8em;
    text-transform: capitalize;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  /* Column widths and alignments */
  .th-game {
    text-align: left;
    width: 15%;
  }

  .th-user {
    text-align: left;
    width: 15%;
  }

  .th-time {
    text-align: center;
    width: 15%;
  }

  .th-bet {
    text-align: right;
    width: 20%;
  }

  .th-multiplier {
    text-align: center;
    width: 15%;
  }

  .th-payout {
    text-align: right;
    width: 20%;
  }

  .bets-table td {
    padding: 14px 16px;
    color: #b1bad3;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    vertical-align: middle;
  }

  /* Cell alignments */
  .td-game {
    text-align: left;
  }

  .td-user {
    text-align: left;
  }

  .td-time {
    text-align: center;
    color: #b1bad3;
  }

  .td-bet {
    text-align: right;
  }

  .td-multiplier {
    text-align: center;
    color: #b1bad3;
    font-weight: 500;
  }

  .td-payout {
    text-align: right;
    font-weight: 600;
  }

  .td-payout.win-payout .amount-value {
    color: #00e701;
  }

  .td-payout.loss-payout .amount-value {
    color: #b1bad3;
  }

  .bets-table tbody tr:last-child td {
    border-bottom: none;
  }

  .bets-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .win-row {
    background: rgba(0, 231, 1, 0.05);
  }

  .win-row:hover {
    background: rgba(0, 231, 1, 0.08);
  }

  .game-cell {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .game-icon {
    width: 32px;
    height: 32px;
    background: #213743;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1em;
    flex-shrink: 0;
  }

  .game-label {
    color: #fff;
    font-weight: 500;
  }

  .user-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #7f8c8d;
  }

  .user-cell :global(.hidden-user-icon) {
    color: #5b6b7a;
    flex-shrink: 0;
  }

  .bet-cell,
  .payout-cell {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .amount-value {
    color: #fff;
    font-weight: 500;
  }

  .currency-icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .currency-icon.tether {
    background: linear-gradient(135deg, #26a17b, #1a8a6a);
    color: #fff;
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

    /* Responsive table - hide columns like Stake */
    .bets-table-container {
      border-radius: 8px;
    }

    .bets-table {
      font-size: 0.9em;
      min-width: unset;
    }

    .bets-table th,
    .bets-table td {
      padding: 14px 12px;
    }

    /* Hide User, Time, Bet Amount, Multiplier - show only Game and Payout */
    .th-user,
    .th-time,
    .th-bet,
    .th-multiplier,
    .td-user,
    .td-time,
    .td-bet,
    .td-multiplier {
      display: none;
    }

    .th-game {
      width: 50%;
    }

    .th-payout {
      width: 50%;
    }

    .game-icon {
      width: 28px;
      height: 28px;
      font-size: 0.9em;
    }

    .game-label {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .currency-icon {
      width: 16px;
      height: 16px;
      font-size: 9px;
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

    .game-label {
      max-width: 100px;
    }

    .game-icon {
      width: 24px;
      height: 24px;
    }
  }
</style>
