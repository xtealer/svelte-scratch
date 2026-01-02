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

  // Payout multipliers
  const PLAYER_PAYOUT = 2; // 1:1 (bet returned + 1x profit)
  const BANKER_PAYOUT = 1.95; // 0.95:1 (5% commission)
  const TIE_PAYOUT = 9; // 8:1 (bet returned + 8x profit)

  // Card types
  type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
  type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

  interface Card {
    suit: Suit;
    rank: Rank;
    faceUp: boolean;
  }

  type BetType = 'player' | 'banker' | 'tie';

  // Game state
  let betAmount = $state(0);
  let muted = $state(false);
  let gameActive = $state(false);
  let gamePhase = $state<'betting' | 'dealing' | 'finished'>('betting');
  let playerHand = $state<Card[]>([]);
  let bankerHand = $state<Card[]>([]);
  let deck = $state<Card[]>([]);
  let result = $state<'player' | 'banker' | 'tie' | null>(null);
  let winnings = $state(0);
  let selectedBet = $state<BetType>('player');

  // Settings panel
  let showSettings = $state(false);

  // Balance state
  let isLoggedIn = $derived($isPlayerLoggedIn);
  let balance = $derived($usdtBalance);

  // Hand values
  let playerValue = $derived(calculateHandValue(playerHand));
  let bankerValue = $derived(calculateHandValue(bankerHand));

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
  let sounds: { card: HTMLAudioElement; win: HTMLAudioElement; lose: HTMLAudioElement; chip: HTMLAudioElement } | null = null;

  onMount(() => {
    initLanguage();

    if (browser) {
      sounds = {
        card: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
        win: new Audio("https://assets.mixkit.co/active_storage/sfx/1943/1943-preview.mp3"),
        lose: new Audio("https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"),
        chip: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
      };
    }
  });

  function createDeck(): Card[] {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck: Card[] = [];

    // Use 8 decks like casinos
    for (let d = 0; d < 8; d++) {
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

  function drawCard(): Card {
    if (deck.length === 0) {
      deck = createDeck();
    }
    const card = deck.pop()!;
    return { ...card, faceUp: true };
  }

  function getCardValue(card: Card): number {
    if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0;
    if (card.rank === 'A') return 1;
    return parseInt(card.rank);
  }

  function calculateHandValue(hand: Card[]): number {
    let value = 0;
    for (const card of hand) {
      value += getCardValue(card);
    }
    return value % 10; // Baccarat uses only the last digit
  }

  function isNatural(value: number): boolean {
    return value === 8 || value === 9;
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

  function selectBet(type: BetType) {
    if (gameActive) return;
    selectedBet = type;
    playSound(sounds?.chip);
    haptic('light');
  }

  // Banker third card rules
  function shouldBankerDraw(bankerTotal: number, playerThirdCard: Card | null): boolean {
    // If player didn't draw, banker draws on 0-5
    if (!playerThirdCard) {
      return bankerTotal <= 5;
    }

    const playerThirdValue = getCardValue(playerThirdCard);

    switch (bankerTotal) {
      case 0:
      case 1:
      case 2:
        return true;
      case 3:
        return playerThirdValue !== 8;
      case 4:
        return playerThirdValue >= 2 && playerThirdValue <= 7;
      case 5:
        return playerThirdValue >= 4 && playerThirdValue <= 7;
      case 6:
        return playerThirdValue === 6 || playerThirdValue === 7;
      case 7:
        return false;
      default:
        return false;
    }
  }

  async function deal() {
    if (gameActive || !isLoggedIn || betAmount <= 0 || betAmount > balance) return;

    const authState = playerAuth.get();
    if (!authState.token) return;

    // Initialize game
    deck = createDeck();
    playerHand = [];
    bankerHand = [];
    result = null;
    winnings = 0;
    gameActive = true;
    gamePhase = 'dealing';

    // Deduct bet first
    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'baccarat',
          bet: betAmount,
          action: 'deal'
        }),
      });
      const apiResult = await response.json();
      if (apiResult.success) {
        playerAuth.updateBalance(apiResult.balance);
      }
    } catch (e) {
      // Handle error
    }

    // Deal initial cards (alternating: Player, Banker, Player, Banker)
    await new Promise(r => setTimeout(r, 300));
    playerHand = [...playerHand, drawCard()];
    playSound(sounds?.card);

    await new Promise(r => setTimeout(r, 300));
    bankerHand = [...bankerHand, drawCard()];
    playSound(sounds?.card);

    await new Promise(r => setTimeout(r, 300));
    playerHand = [...playerHand, drawCard()];
    playSound(sounds?.card);

    await new Promise(r => setTimeout(r, 300));
    bankerHand = [...bankerHand, drawCard()];
    playSound(sounds?.card);

    haptic('medium');

    // Check for naturals
    const playerTotal = calculateHandValue(playerHand);
    const bankerTotal = calculateHandValue(bankerHand);

    if (isNatural(playerTotal) || isNatural(bankerTotal)) {
      // Natural - no more cards
      await new Promise(r => setTimeout(r, 500));
      await determineWinner();
      return;
    }

    // Player third card rules
    let playerThirdCard: Card | null = null;

    if (playerTotal <= 5) {
      // Player draws
      await new Promise(r => setTimeout(r, 500));
      playerThirdCard = drawCard();
      playerHand = [...playerHand, playerThirdCard];
      playSound(sounds?.card);
    }

    // Banker third card rules
    const newBankerTotal = calculateHandValue(bankerHand);
    if (shouldBankerDraw(newBankerTotal, playerThirdCard)) {
      await new Promise(r => setTimeout(r, 500));
      bankerHand = [...bankerHand, drawCard()];
      playSound(sounds?.card);
    }

    await new Promise(r => setTimeout(r, 500));
    await determineWinner();
  }

  async function determineWinner() {
    const playerTotal = calculateHandValue(playerHand);
    const bankerTotal = calculateHandValue(bankerHand);

    if (playerTotal > bankerTotal) {
      result = 'player';
    } else if (bankerTotal > playerTotal) {
      result = 'banker';
    } else {
      result = 'tie';
    }

    // Calculate winnings
    if (result === selectedBet) {
      if (selectedBet === 'player') {
        winnings = betAmount * PLAYER_PAYOUT;
      } else if (selectedBet === 'banker') {
        winnings = betAmount * BANKER_PAYOUT;
      } else {
        winnings = betAmount * TIE_PAYOUT;
      }
      playSound(sounds?.win);
    } else if (result === 'tie' && selectedBet !== 'tie') {
      // Tie returns bet for player/banker bets
      winnings = betAmount;
      playSound(sounds?.card);
    } else {
      winnings = 0;
      playSound(sounds?.lose);
    }

    gamePhase = 'finished';
    gameActive = false;

    // Process result with server
    const authState = playerAuth.get();
    if (!authState.token) return;

    try {
      const response = await fetch("/api/game/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          gameId: 'baccarat',
          bet: betAmount,
          action: 'finish',
          result: result,
          selectedBet: selectedBet,
          winnings: winnings
        }),
      });
      const apiResult = await response.json();
      if (apiResult.success) {
        playerAuth.updateBalance(apiResult.balance);

        if (winnings > betAmount) {
          const profit = winnings - betAmount;
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
    bankerHand = [];
    result = null;
    winnings = 0;
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

  function getResultText(): string {
    if (!result) return '';
    if (result === 'player') return 'PLAYER WINS';
    if (result === 'banker') return 'BANKER WINS';
    return 'TIE';
  }

  function didWin(): boolean {
    if (!result) return false;
    return result === selectedBet;
  }

  function isPush(): boolean {
    return result === 'tie' && selectedBet !== 'tie';
  }
</script>

<GameNavbar onDeposit={openDepositModal} onWithdraw={openWithdrawModal} onLogin={openLoginModal} onRegister={openRegisterModal} onProfile={openProfileModal} />

<div class="page" dir={$direction}>
  <div class="game-container">
    <!-- Left Panel - Controls -->
    <div class="controls-panel">
      <!-- Bet Amount -->
      <div class="control-group">
        <div class="control-label">
          <span>Bet Amount</span>
          <span class="usd-value">${betAmount.toFixed(2)}</span>
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
            <span class="usdt-icon">$</span>
          </div>
          <button class="bet-action-btn" onclick={halveBet} disabled={gameActive}>½</button>
          <button class="bet-action-btn" onclick={doubleBet} disabled={gameActive}>2×</button>
        </div>
      </div>

      <!-- Bet Selection -->
      <div class="control-group">
        <div class="control-label">
          <span>Bet On</span>
        </div>
        <div class="bet-selection">
          <button
            class="bet-option"
            class:selected={selectedBet === 'player'}
            onclick={() => selectBet('player')}
            disabled={gameActive}
          >
            <span class="bet-option-name">Player</span>
            <span class="bet-option-payout">1:1</span>
          </button>
          <button
            class="bet-option tie-option"
            class:selected={selectedBet === 'tie'}
            onclick={() => selectBet('tie')}
            disabled={gameActive}
          >
            <span class="bet-option-name">Tie</span>
            <span class="bet-option-payout">8:1</span>
          </button>
          <button
            class="bet-option"
            class:selected={selectedBet === 'banker'}
            onclick={() => selectBet('banker')}
            disabled={gameActive}
          >
            <span class="bet-option-name">Banker</span>
            <span class="bet-option-payout">0.95:1</span>
          </button>
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
      {:else if gamePhase === 'finished'}
        <button class="bet-button" onclick={newGame}>
          New Game
        </button>
      {:else}
        <button class="bet-button" disabled>
          Dealing...
        </button>
      {/if}

      <!-- Game Result -->
      {#if result}
        <div class="result-display" class:win={didWin()} class:push={isPush()} class:lose={!didWin() && !isPush()}>
          {#if didWin()}
            <span class="result-text">You Win!</span>
            <span class="result-amount">+${(winnings - betAmount).toFixed(2)}</span>
          {:else if isPush()}
            <span class="result-text">Push</span>
            <span class="result-amount">Bet returned</span>
          {:else}
            <span class="result-text">You Lose</span>
            <span class="result-amount">-${betAmount.toFixed(2)}</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Right Panel - Game Area -->
    <div class="game-panel">
      <!-- Banker Hand -->
      <div class="hand-section banker">
        <div class="hand-label">
          <span>Banker</span>
          <span class="hand-value" class:winning={result === 'banker'}>{bankerValue}</span>
        </div>
        <div class="cards">
          {#each bankerHand as card, i}
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

      <!-- Table Area -->
      <div class="table-center">
        {#if result}
          <div class="result-badge" class:player-win={result === 'player'} class:banker-win={result === 'banker'} class:tie-result={result === 'tie'}>
            {getResultText()}
          </div>
        {:else if gamePhase === 'betting'}
          <div class="table-info">
            <div class="payout-info">
              <div class="payout-row">
                <span>Player</span>
                <span>1:1</span>
              </div>
              <div class="payout-row tie">
                <span>Tie</span>
                <span>8:1</span>
              </div>
              <div class="payout-row">
                <span>Banker</span>
                <span>0.95:1</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Player Hand -->
      <div class="hand-section player">
        <div class="hand-label">
          <span>Player</span>
          <span class="hand-value" class:winning={result === 'player'}>{playerValue}</span>
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

  .usdt-icon {
    position: absolute;
    right: 12px;
    color: #26a17b;
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

  .bet-selection {
    display: flex;
    gap: 8px;
  }

  .bet-option {
    flex: 1;
    padding: 12px 8px;
    background: #0f212e;
    border: 2px solid transparent;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .bet-option:hover:not(:disabled) {
    background: #2a3f4f;
  }

  .bet-option.selected {
    border-color: #00e701;
    background: rgba(0, 231, 1, 0.1);
  }

  .bet-option:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .bet-option-name {
    font-weight: 600;
    font-size: 0.9em;
  }

  .bet-option-payout {
    font-size: 0.75em;
    color: #7f8c8d;
  }

  .tie-option.selected {
    border-color: #f7931a;
    background: rgba(247, 147, 26, 0.1);
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
    background: linear-gradient(135deg, #8b0000 0%, #5c0000 100%);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 500px;
    position: relative;
    border: 8px solid #4a0000;
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
    min-width: 36px;
    text-align: center;
  }

  .hand-value.winning {
    background: rgba(0, 231, 1, 0.5);
    color: #00e701;
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

  .table-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
  }

  .table-info {
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 2px solid rgba(255, 215, 0, 0.3);
  }

  .payout-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .payout-row {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9em;
  }

  .payout-row.tie {
    color: #ffd700;
  }

  .result-badge {
    padding: 12px 32px;
    border-radius: 8px;
    font-size: 1.5em;
    font-weight: 700;
    text-transform: uppercase;
    animation: popIn 0.3s ease;
  }

  .result-badge.player-win {
    background: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    border: 2px solid #3b82f6;
  }

  .result-badge.banker-win {
    background: rgba(239, 68, 68, 0.3);
    color: #ef4444;
    border: 2px solid #ef4444;
  }

  .result-badge.tie-result {
    background: rgba(255, 215, 0, 0.3);
    color: #ffd700;
    border: 2px solid #ffd700;
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

    .bet-selection {
      flex-wrap: wrap;
    }

    .bet-option {
      min-width: 80px;
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

    .bet-selection {
      gap: 6px;
    }

    .bet-option {
      padding: 10px 6px;
    }

    .bet-option-name {
      font-size: 0.8em;
    }
  }
</style>
