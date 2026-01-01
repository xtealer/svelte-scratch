<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import DepositModal from "$lib/DepositModal.svelte";
  import WithdrawModal from "$lib/WithdrawModal.svelte";
  import LoginModal from "$lib/LoginModal.svelte";
  import RegisterModal from "$lib/RegisterModal.svelte";
  import ProfileModal from "$lib/ProfileModal.svelte";
  import GameNavbar from "$lib/GameNavbar.svelte";
  import { initLanguage, direction, t } from "$lib/i18n";
  import { Settings, Volume2, VolumeX, RefreshCw } from "lucide-svelte";
  import { playerAuth, isPlayerLoggedIn, usdtBalance } from "$lib/stores/playerAuth";
  import { WinCelebration } from "$lib/components";
  import { hapticWin, haptic } from "$lib/utils/haptics";

  // Game constants
  const MIN_BET = 0.00000001;
  const MAX_BET = 10;

  // Card types
  type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
  type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

  interface Card {
    suit: Suit;
    rank: Rank;
    faceUp: boolean;
  }

  // Game state
  let betAmount = $state(0);
  let muted = $state(false);
  let gameActive = $state(false);
  let gamePhase = $state<'betting' | 'player' | 'dealer' | 'finished'>('betting');
  let playerHand = $state<Card[]>([]);
  let dealerHand = $state<Card[]>([]);
  let deck = $state<Card[]>([]);
  let result = $state<'win' | 'lose' | 'push' | 'blackjack' | null>(null);
  let winnings = $state(0);
  let canDoubleDown = $state(false);
  let canSplit = $state(false);
  let isDoubledDown = $state(false);

  // Mode state
  let mode = $state<'manual' | 'auto'>('manual');

  // Settings panel
  let showSettings = $state(false);

  // Balance state
  let isLoggedIn = $derived($isPlayerLoggedIn);
  let balance = $derived($usdtBalance);

  // Hand values
  let playerValue = $derived(calculateHandValue(playerHand));
  let dealerValue = $derived(calculateHandValue(dealerHand));
  let dealerVisibleValue = $derived(gamePhase === 'finished' ? dealerValue : calculateHandValue(dealerHand.filter(c => c.faceUp)));

  // Modals
  let showDepositModal = $state(false);
  let showWithdrawModal = $state(false);
  let showLoginModal = $state(false);
  let showRegisterModal = $state(false);
  let showProfileModal = $state(false);

  // Win celebration state
  let showWinCelebration = $state(false);
  let celebrationAmount = $state(0);
  let celebrationLevel = $state<'normal' | 'big' | 'mega'>('normal');

  // Sounds
  let sounds: { card: HTMLAudioElement; win: HTMLAudioElement; lose: HTMLAudioElement; blackjack: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();

    if (browser) {
      sounds = {
        card: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
        win: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        lose: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
        blackjack: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"),
      };
    }
  });

  function createDeck(): Card[] {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck: Card[] = [];

    // Use 6 decks like casinos
    for (let d = 0; d < 6; d++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          newDeck.push({ suit, rank, faceUp: true });
        }
      }
    }

    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    return newDeck;
  }

  function drawCard(faceUp: boolean = true): Card {
    if (deck.length === 0) {
      deck = createDeck();
    }
    const card = deck.pop()!;
    return { ...card, faceUp };
  }

  function getCardValue(card: Card): number {
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank);
  }

  function calculateHandValue(hand: Card[]): number {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (!card.faceUp) continue;
      value += getCardValue(card);
      if (card.rank === 'A') aces++;
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  }

  function isBlackjack(hand: Card[]): boolean {
    return hand.length === 2 && calculateHandValue(hand) === 21;
  }

  function playSound(sound: HTMLAudioElement | undefined) {
    if (sound && !muted) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  function toggleMute() {
    muted = !muted;
    haptic('light');
  }

  function closeAllModals() {
    showDepositModal = false;
    showWithdrawModal = false;
    showLoginModal = false;
    showRegisterModal = false;
    showProfileModal = false;
    showSettings = false;
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

  function toggleSettings() {
    showSettings = !showSettings;
  }

  // Bet amount controls
  function halveBet() {
    betAmount = Math.max(MIN_BET, betAmount / 2);
    haptic('light');
  }

  function doubleBet() {
    betAmount = Math.min(balance, MAX_BET, betAmount * 2);
    haptic('light');
  }

  async function deal() {
    if (gameActive || !isLoggedIn || betAmount <= 0 || betAmount > balance) return;

    const authState = playerAuth.get();
    if (!authState.token) return;

    // Initialize game
    deck = createDeck();
    playerHand = [];
    dealerHand = [];
    result = null;
    winnings = 0;
    isDoubledDown = false;
    gameActive = true;
    gamePhase = 'player';

    // Deal cards
    await new Promise(r => setTimeout(r, 200));
    playerHand = [...playerHand, drawCard()];
    playSound(sounds?.card);

    await new Promise(r => setTimeout(r, 200));
    dealerHand = [...dealerHand, drawCard()];
    playSound(sounds?.card);

    await new Promise(r => setTimeout(r, 200));
    playerHand = [...playerHand, drawCard()];
    playSound(sounds?.card);

    await new Promise(r => setTimeout(r, 200));
    dealerHand = [...dealerHand, drawCard(false)]; // Face down
    playSound(sounds?.card);

    // Check for double down and split eligibility
    canDoubleDown = playerHand.length === 2 && balance >= betAmount * 2;
    canSplit = playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank;

    // Deduct bet
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'blackjack',
          bet: betAmount,
          action: 'deal'
        }),
      });
      const result = await response.json();
      if (result.success) {
        playerAuth.updateBalance(result.balance);
      }
    } catch (e) {
      // Handle error
    }

    // Check for blackjack
    if (isBlackjack(playerHand)) {
      await revealDealerCard();
      if (isBlackjack(dealerHand)) {
        endGame('push');
      } else {
        endGame('blackjack');
      }
    }

    haptic('medium');
  }

  async function hit() {
    if (gamePhase !== 'player') return;

    playerHand = [...playerHand, drawCard()];
    playSound(sounds?.card);
    canDoubleDown = false;
    canSplit = false;

    if (playerValue > 21) {
      await revealDealerCard();
      endGame('lose');
    }

    haptic('light');
  }

  async function stand() {
    if (gamePhase !== 'player') return;

    gamePhase = 'dealer';
    await revealDealerCard();
    await dealerPlay();
  }

  async function doubleDown() {
    if (!canDoubleDown || gamePhase !== 'player') return;

    isDoubledDown = true;
    canDoubleDown = false;
    canSplit = false;

    // Draw one card
    playerHand = [...playerHand, drawCard()];
    playSound(sounds?.card);

    if (playerValue > 21) {
      await revealDealerCard();
      endGame('lose');
    } else {
      await stand();
    }

    haptic('medium');
  }

  async function revealDealerCard() {
    dealerHand = dealerHand.map(c => ({ ...c, faceUp: true }));
    await new Promise(r => setTimeout(r, 300));
  }

  async function dealerPlay() {
    // Dealer draws until 17 or higher
    while (dealerValue < 17) {
      await new Promise(r => setTimeout(r, 500));
      dealerHand = [...dealerHand, drawCard()];
      playSound(sounds?.card);
    }

    // Determine winner
    if (dealerValue > 21) {
      endGame('win');
    } else if (playerValue > dealerValue) {
      endGame('win');
    } else if (playerValue < dealerValue) {
      endGame('lose');
    } else {
      endGame('push');
    }
  }

  async function endGame(gameResult: 'win' | 'lose' | 'push' | 'blackjack') {
    result = gameResult;
    gamePhase = 'finished';
    gameActive = false;

    const authState = playerAuth.get();
    if (!authState.token) return;

    // Calculate winnings
    const effectiveBet = isDoubledDown ? betAmount * 2 : betAmount;
    if (gameResult === 'blackjack') {
      winnings = effectiveBet * 2.5; // 3:2 payout
      playSound(sounds?.blackjack);
    } else if (gameResult === 'win') {
      winnings = effectiveBet * 2;
      playSound(sounds?.win);
    } else if (gameResult === 'push') {
      winnings = effectiveBet; // Return bet
      playSound(sounds?.card);
    } else {
      winnings = 0;
      playSound(sounds?.lose);
    }

    // Process result with server
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'blackjack',
          bet: effectiveBet,
          action: 'finish',
          result: gameResult,
          winnings: winnings
        }),
      });
      const apiResult = await response.json();
      if (apiResult.success) {
        playerAuth.updateBalance(apiResult.balance);

        if (winnings > effectiveBet) {
          const profit = winnings - effectiveBet;
          hapticWin(profit);

          // Show celebration for bigger wins
          if (profit >= 1) {
            celebrationAmount = profit;
            celebrationLevel = profit >= 50 ? 'mega' : profit >= 10 ? 'big' : 'normal';
            showWinCelebration = true;
          }
        }
      }
    } catch (e) {
      // Handle error
    }
  }

  function newGame() {
    gamePhase = 'betting';
    playerHand = [];
    dealerHand = [];
    result = null;
    winnings = 0;
    isDoubledDown = false;
  }

  function getSuitSymbol(suit: Suit): string {
    const symbols: Record<Suit, string> = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return symbols[suit];
  }

  function getSuitColor(suit: Suit): string {
    return suit === 'hearts' || suit === 'diamonds' ? '#ed4848' : '#333';
  }
</script>

<GameNavbar onDeposit={openDepositModal} onWithdraw={openWithdrawModal} onLogin={openLoginModal} onRegister={openRegisterModal} onProfile={openProfileModal} />

<div class="page" dir={$direction}>
  <div class="game-container">
    <!-- Left Panel - Controls -->
    <div class="controls-panel">
      <!-- Mode Toggle -->
      <div class="mode-toggle">
        <button class="mode-btn" class:active={mode === 'manual'} onclick={() => mode = 'manual'}>
          Manual
        </button>
        <button class="mode-btn" class:active={mode === 'auto'} onclick={() => mode = 'auto'}>
          Auto
        </button>
      </div>

      <!-- Bet Amount -->
      <div class="control-group">
        <div class="control-label">
          <span>Bet Amount</span>
          <span class="usd-value">${(betAmount * 90000).toFixed(2)}</span>
        </div>
        <div class="bet-input-row">
          <div class="bet-input-wrapper">
            <input
              type="number"
              class="bet-input"
              bind:value={betAmount}
              min={MIN_BET}
              max={Math.min(balance, MAX_BET)}
              step="0.00000001"
              disabled={gameActive}
            />
            <span class="btc-icon">₿</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet} disabled={gameActive}>½</button>
          <button class="bet-action-btn" onclick={doubleBet} disabled={gameActive}>2×</button>
        </div>
      </div>

      <!-- Deal/Action Buttons -->
      {#if gamePhase === 'betting'}
        <button
          class="bet-button"
          onclick={deal}
          disabled={!isLoggedIn || betAmount <= 0 || betAmount > balance}
        >
          Deal
        </button>
      {:else if gamePhase === 'player'}
        <div class="action-buttons">
          <button class="action-btn hit" onclick={hit}>
            Hit
          </button>
          <button class="action-btn stand" onclick={stand}>
            Stand
          </button>
          {#if canDoubleDown}
            <button class="action-btn double" onclick={doubleDown}>
              Double
            </button>
          {/if}
        </div>
      {:else if gamePhase === 'finished'}
        <button class="bet-button" onclick={newGame}>
          New Game
        </button>
      {:else}
        <button class="bet-button" disabled>
          Dealer's Turn...
        </button>
      {/if}

      <!-- Game Result -->
      {#if result}
        <div class="result-display" class:win={result === 'win' || result === 'blackjack'} class:push={result === 'push'} class:lose={result === 'lose'}>
          {#if result === 'blackjack'}
            <span class="result-text">BLACKJACK!</span>
            <span class="result-amount">+{(winnings - betAmount).toFixed(8)} ₿</span>
          {:else if result === 'win'}
            <span class="result-text">You Win!</span>
            <span class="result-amount">+{(winnings - betAmount).toFixed(8)} ₿</span>
          {:else if result === 'push'}
            <span class="result-text">Push</span>
            <span class="result-amount">Bet returned</span>
          {:else}
            <span class="result-text">You Lose</span>
            <span class="result-amount">-{betAmount.toFixed(8)} ₿</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Right Panel - Game Area -->
    <div class="game-panel">
      <!-- Dealer Hand -->
      <div class="hand-section dealer">
        <div class="hand-label">
          <span>Dealer</span>
          <span class="hand-value">{dealerVisibleValue}</span>
        </div>
        <div class="cards">
          {#each dealerHand as card, i}
            <div
              class="card"
              class:face-down={!card.faceUp}
              style="--card-index: {i}"
            >
              {#if card.faceUp}
                <div class="card-content" style="color: {getSuitColor(card.suit)}">
                  <span class="card-rank">{card.rank}</span>
                  <span class="card-suit">{getSuitSymbol(card.suit)}</span>
                </div>
              {:else}
                <div class="card-back"></div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Table Area -->
      <div class="table-center">
        {#if result}
          <div class="result-badge" class:win={result === 'win' || result === 'blackjack'} class:push={result === 'push'} class:lose={result === 'lose'}>
            {#if result === 'blackjack'}
              BLACKJACK!
            {:else if result === 'win'}
              WIN
            {:else if result === 'push'}
              PUSH
            {:else}
              BUST
            {/if}
          </div>
        {/if}
      </div>

      <!-- Player Hand -->
      <div class="hand-section player">
        <div class="hand-label">
          <span>You</span>
          <span class="hand-value" class:bust={playerValue > 21}>{playerValue}</span>
        </div>
        <div class="cards">
          {#each playerHand as card, i}
            <div
              class="card"
              style="--card-index: {i}"
            >
              <div class="card-content" style="color: {getSuitColor(card.suit)}">
                <span class="card-rank">{card.rank}</span>
                <span class="card-suit">{getSuitSymbol(card.suit)}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="game-footer">
    <div class="footer-left">
      <button class="footer-btn" onclick={toggleSettings}>
        <Settings size={18} />
      </button>
      <button class="footer-btn" onclick={toggleMute}>
        {#if muted}
          <VolumeX size={18} />
        {:else}
          <Volume2 size={18} />
        {/if}
      </button>
    </div>
    <div class="footer-center">
      <span class="stake-logo">Stake</span>
    </div>
    <div class="footer-right">
      <button class="fairness-btn">
        <RefreshCw size={14} />
        <span>Fairness</span>
      </button>
    </div>
  </div>
</div>

<DepositModal bind:show={showDepositModal} />
<WithdrawModal bind:show={showWithdrawModal} />
<LoginModal bind:show={showLoginModal} onSwitchToRegister={switchToRegister} />
<RegisterModal bind:show={showRegisterModal} onSwitchToLogin={switchToLogin} />
<ProfileModal bind:show={showProfileModal} />

<WinCelebration
  bind:show={showWinCelebration}
  amount={celebrationAmount}
  level={celebrationLevel}
  duration={2500}
/>

<style>
  .page {
    min-height: 100vh;
    min-height: 100dvh;
    background: #0f1923;
    display: flex;
    flex-direction: column;
    padding-top: 60px;
  }

  .game-container {
    flex: 1;
    display: flex;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 16px;
    gap: 16px;
  }

  /* Controls Panel */
  .controls-panel {
    width: 280px;
    min-width: 280px;
    background: #1a2c38;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mode-toggle {
    display: flex;
    background: #0f212e;
    border-radius: 24px;
    padding: 4px;
    gap: 4px;
  }

  .mode-btn {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 20px;
    background: transparent;
    color: #7f8c8d;
    font-weight: 600;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-btn.active {
    background: #2a3f4f;
    color: #fff;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.85em;
    color: #7f8c8d;
  }

  .usd-value {
    color: #7f8c8d;
  }

  .bet-input-row {
    display: flex;
    gap: 8px;
  }

  .bet-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  .bet-input {
    width: 100%;
    padding: 12px 40px 12px 12px;
    background: #0f212e;
    border: 2px solid transparent;
    border-radius: 8px;
    color: #fff;
    font-size: 1em;
    font-weight: 500;
  }

  .bet-input:focus {
    outline: none;
    border-color: #00e701;
  }

  .bet-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btc-icon {
    position: absolute;
    right: 12px;
    color: #f7931a;
    font-weight: bold;
  }

  .bet-action-btn {
    padding: 12px 16px;
    background: #0f212e;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .bet-action-btn:hover:not(:disabled) {
    background: #2a3f4f;
  }

  .bet-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .bet-button {
    width: 100%;
    padding: 16px;
    background: #00e701;
    border: none;
    border-radius: 8px;
    color: #0f1923;
    font-size: 1.1em;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .bet-button:hover:not(:disabled) {
    background: #00c700;
    transform: scale(1.02);
  }

  .bet-button:disabled {
    background: #2a3f4f;
    color: #7f8c8d;
    cursor: not-allowed;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn.hit {
    background: #00e701;
    color: #0f1923;
  }

  .action-btn.hit:hover {
    background: #00c700;
  }

  .action-btn.stand {
    background: #ed4848;
    color: #fff;
  }

  .action-btn.stand:hover {
    background: #d43c3c;
  }

  .action-btn.double {
    background: #f7931a;
    color: #fff;
  }

  .action-btn.double:hover {
    background: #e88a00;
  }

  .result-display {
    padding: 16px;
    border-radius: 8px;
    text-align: center;
  }

  .result-display.win {
    background: rgba(0, 231, 1, 0.2);
  }

  .result-display.push {
    background: rgba(127, 140, 141, 0.2);
  }

  .result-display.lose {
    background: rgba(237, 72, 72, 0.2);
  }

  .result-text {
    display: block;
    font-size: 1.2em;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }

  .result-display.win .result-text {
    color: #00e701;
  }

  .result-display.lose .result-text {
    color: #ed4848;
  }

  .result-amount {
    display: block;
    font-size: 0.9em;
    color: #7f8c8d;
  }

  .result-display.win .result-amount {
    color: #00e701;
  }

  /* Game Panel */
  .game-panel {
    flex: 1;
    background: linear-gradient(135deg, #1a4d2e 0%, #0d3d1f 100%);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 500px;
    position: relative;
    border: 8px solid #2a5a3a;
  }

  .hand-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .hand-label {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    font-weight: 600;
    font-size: 1em;
  }

  .hand-value {
    background: rgba(0, 0, 0, 0.5);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 1.1em;
  }

  .hand-value.bust {
    background: rgba(237, 72, 72, 0.5);
    color: #ed4848;
  }

  .cards {
    display: flex;
    justify-content: center;
    min-height: 120px;
  }

  .card {
    width: 80px;
    height: 110px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    margin-left: calc(var(--card-index) * -30px);
    transition: transform 0.3s;
    position: relative;
    animation: dealCard 0.3s ease;
  }

  .card:first-child {
    margin-left: 0;
  }

  .card:hover {
    transform: translateY(-10px);
    z-index: 10;
  }

  @keyframes dealCard {
    from {
      opacity: 0;
      transform: translateY(-50px) rotate(-10deg);
    }
    to {
      opacity: 1;
      transform: translateY(0) rotate(0);
    }
  }

  .card-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .card-rank {
    font-size: 1.8em;
    font-weight: 700;
  }

  .card-suit {
    font-size: 2.2em;
  }

  .card.face-down {
    background: linear-gradient(135deg, #1a2c38 0%, #2a3f4f 100%);
  }

  .card-back {
    width: 100%;
    height: 100%;
    background:
      repeating-linear-gradient(
        45deg,
        #2a3f4f,
        #2a3f4f 10px,
        #1a2c38 10px,
        #1a2c38 20px
      );
    border-radius: 8px;
    border: 4px solid #f7931a;
    box-sizing: border-box;
  }

  .table-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
  }

  .result-badge {
    padding: 12px 32px;
    border-radius: 8px;
    font-size: 1.5em;
    font-weight: 700;
    text-transform: uppercase;
    animation: popIn 0.3s ease;
  }

  .result-badge.win {
    background: rgba(0, 231, 1, 0.3);
    color: #00e701;
    border: 2px solid #00e701;
  }

  .result-badge.push {
    background: rgba(127, 140, 141, 0.3);
    color: #fff;
    border: 2px solid #7f8c8d;
  }

  .result-badge.lose {
    background: rgba(237, 72, 72, 0.3);
    color: #ed4848;
    border: 2px solid #ed4848;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Footer */
  .game-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0f212e;
    border-top: 1px solid #1a2c38;
  }

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .footer-btn {
    padding: 8px;
    background: transparent;
    border: none;
    color: #7f8c8d;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .footer-btn:hover {
    background: #1a2c38;
    color: #fff;
  }

  .footer-center {
    flex: 1;
    text-align: center;
  }

  .stake-logo {
    font-family: 'Georgia', serif;
    font-style: italic;
    font-size: 1.2em;
    color: #fff;
    font-weight: 600;
  }

  .fairness-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #1a2c38;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fairness-btn:hover {
    background: #2a3f4f;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .game-container {
      flex-direction: column-reverse;
      padding: 8px;
    }

    .controls-panel {
      width: 100%;
      min-width: unset;
    }

    .game-panel {
      padding: 16px;
      min-height: 400px;
    }

    .card {
      width: 60px;
      height: 85px;
    }

    .card-rank {
      font-size: 1.4em;
    }

    .card-suit {
      font-size: 1.6em;
    }
  }

  @media (max-width: 480px) {
    .page {
      padding-top: 52px;
    }

    .bet-input-row {
      flex-wrap: wrap;
    }

    .bet-input-wrapper {
      width: 100%;
    }

    .bet-action-btn {
      flex: 1;
    }

    .card {
      width: 50px;
      height: 70px;
    }

    .card-rank {
      font-size: 1.1em;
    }

    .card-suit {
      font-size: 1.3em;
    }

    .result-badge {
      font-size: 1.2em;
      padding: 8px 20px;
    }
  }
</style>
