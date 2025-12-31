<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import QRCode from 'qrcode';
  import {
    CreditCard,
    ArrowLeft,
    Plus,
    Download,
    Copy,
    Check,
    Image,
    FileText,
    ShoppingCart
  } from 'lucide-svelte';
  import Footer from '$lib/Footer.svelte';
  import { initLanguage, t, getLanguage, direction } from '$lib/i18n';

  interface Card {
    _id: string;
    code: string;
    amount: number;
    used: boolean;
    usedAt?: string;
    createdAt: string;
    soldAt?: string;
    sold?: boolean;
  }

  interface Stats {
    total: number;
    used: number;
    unused: number;
    sold: number;
    totalValue: number;
    soldValue: number;
  }

  let cards = $state<Card[]>([]);
  let stats = $state<Stats | null>(null);
  let loading = $state(true);

  // Generate form
  let showGenerate = $state(false);
  let genAmount = $state(1);
  let generating = $state(false);

  // Generated card display
  let generatedCard = $state<{ code: string; amount: number } | null>(null);
  let copiedCode = $state<string | null>(null);

  // Mark as sold
  let markingAsSold = $state<string | null>(null);

  onMount(async () => {
    initLanguage();
    await checkAuth();
    await loadCards();
  });

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (!data.authenticated) {
        goto('/admin');
      }
    } catch {
      goto('/admin');
    }
  }

  async function loadCards() {
    loading = true;
    try {
      const res = await fetch('/api/admin/cards');
      if (res.ok) {
        const data = await res.json();
        cards = data.cards;
        stats = data.stats;
      }
    } catch {
      // Handle error
    }
    loading = false;
  }

  async function generateCard(e: Event) {
    e.preventDefault();
    generating = true;

    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: genAmount
        })
      });

      if (res.ok) {
        const data = await res.json();
        generatedCard = data.card;
        await loadCards();
      }
    } catch {
      // Handle error
    }
    generating = false;
  }

  async function copyCodeOnly(code: string) {
    await navigator.clipboard.writeText(code);
    copiedCode = code;
    setTimeout(() => copiedCode = null, 2000);
  }

  async function copyAsText() {
    if (!generatedCard) return;
    const translations = get(t);
    const rc = translations.rechargeCard;
    const text = `🎰 ${rc.title} 🎰

${rc.code}: ${generatedCard.code}
${rc.amount}: $${generatedCard.amount}

${rc.instructions}
${rc.goodLuck}`;

    await navigator.clipboard.writeText(text);
    copiedCode = generatedCard.code + '-text';
    setTimeout(() => copiedCode = null, 2000);
  }

  async function downloadAsImage() {
    if (!generatedCard) return;
    const card = generatedCard; // Capture for closure
    const translations = get(t);
    const rc = translations.rechargeCard;
    const isRtl = getLanguage() === 'ar';

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(card.code, {
      width: 120,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Load QR code image
    const qrImg = new window.Image();
    qrImg.src = qrDataUrl;

    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const cardWidth = 400;
    const cardHeight = 200;
    const padding = 20;

    canvas.width = cardWidth + padding * 2;
    canvas.height = cardHeight + padding * 2;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const x = padding;
    const y = padding;

    // Card background
    ctx.fillStyle = '#2a2a4a';
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, 12);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Set text direction for RTL
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = isRtl ? 'right' : 'left';
    const textX = isRtl ? x + cardWidth - 160 : x + 20;

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`🎰 ${rc.title}`, textX, y + 35);

    // Code label
    ctx.fillStyle = '#888888';
    ctx.font = '12px Arial';
    ctx.fillText(`${rc.code}:`, textX, y + 65);

    // Code (always LTR for the code itself)
    ctx.direction = 'ltr';
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(card.code, textX, y + 85);

    // Restore direction
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = isRtl ? 'right' : 'left';

    // Amount
    ctx.fillStyle = '#00cc00';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`$${card.amount}`, textX, y + 130);

    // Instructions
    ctx.fillStyle = '#888888';
    ctx.font = '11px Arial';
    ctx.fillText(rc.scanOrEnter, textX, y + 160);
    ctx.fillText(rc.toRecharge, textX, y + 175);

    // Draw QR code (position depends on RTL)
    const qrSize = 130;
    const qrX = isRtl ? x + 15 : x + cardWidth - qrSize - 15;
    const qrY = y + (cardHeight - qrSize) / 2;

    // QR background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 8);
    ctx.fill();

    // Draw QR code
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    canvas.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recharge-card-${card.code}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  function closeGenerated() {
    generatedCard = null;
    showGenerate = false;
  }

  async function markAsSold(code: string) {
    markingAsSold = code;
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (res.ok) {
        await loadCards();
      }
    } catch {
      // Handle error
    }
    markingAsSold = null;
  }
</script>

<div class="admin-container" dir={$direction}>
  <nav class="sidebar">
    <div class="sidebar-header">
      <h2>{$t.common.casinoAdmin}</h2>
    </div>

    <ul class="nav-menu">
      <li>
        <a href="/admin/dashboard">
          <ArrowLeft size={20} />
          <span>{$t.common.backToDashboard}</span>
        </a>
      </li>
    </ul>
  </nav>

  <main class="main-content">
    <header class="top-bar">
      <h1>
        <CreditCard size={28} />
        <span>{$t.cardsAdmin.title}</span>
      </h1>
      <button class="add-btn" onclick={() => { showGenerate = true; generatedCard = null; }}>
        <Plus size={20} />
        <span>{$t.cardsAdmin.generateCard}</span>
      </button>
    </header>

    {#if stats}
      <div class="stats-row">
        <div class="stat">
          <span class="label">{$t.cardsAdmin.total}</span>
          <span class="value">{stats.total}</span>
        </div>
        <div class="stat">
          <span class="label">{$t.cardsAdmin.unused}</span>
          <span class="value green">{stats.unused}</span>
        </div>
        <div class="stat">
          <span class="label">{$t.cardsAdmin.used}</span>
          <span class="value">{stats.used}</span>
        </div>
        <div class="stat">
          <span class="label">{$t.cardsAdmin.sold}</span>
          <span class="value gold">{stats.sold}</span>
        </div>
        <div class="stat">
          <span class="label">{$t.cardsAdmin.totalValue}</span>
          <span class="value">${stats.totalValue.toFixed(2)}</span>
        </div>
        <div class="stat">
          <span class="label">{$t.cardsAdmin.soldValue}</span>
          <span class="value green">${stats.soldValue.toFixed(2)}</span>
        </div>
      </div>
    {/if}

    {#if showGenerate}
      <div class="generate-panel">
        {#if generatedCard}
          <div class="generated-cards">
            <h3>{$t.cardsAdmin.cardGenerated}</h3>
            <div class="cards-list">
              <div class="gen-card">
                <span class="gen-code">{generatedCard.code}</span>
                <span class="gen-info">${generatedCard.amount}</span>
                <button
                  class="copy-btn"
                  onclick={() => copyCodeOnly(generatedCard!.code)}
                  title={$t.cardsAdmin.copyCode}
                >
                  {#if copiedCode === generatedCard.code}
                    <Check size={16} />
                  {:else}
                    <Copy size={16} />
                  {/if}
                </button>
              </div>
            </div>
            <div class="download-actions">
              <button class="download-btn" onclick={copyAsText}>
                <FileText size={18} />
                <span>{copiedCode === generatedCard.code + '-text' ? '✓' : $t.cardsAdmin.copyText}</span>
              </button>
              <button class="download-btn image" onclick={downloadAsImage}>
                <Image size={18} />
                <span>{$t.cardsAdmin.downloadImage}</span>
              </button>
            </div>
            <button class="close-btn" onclick={closeGenerated}>{$t.cardsAdmin.close}</button>
          </div>
        {:else}
          <h3>{$t.cardsAdmin.generateRechargeCard}</h3>
          <form onsubmit={generateCard}>
            <div class="form-grid single">
              <label>
                <span>{$t.cardsAdmin.amountLabel}</span>
                <input type="number" bind:value={genAmount} min="1" max="1000" step="1" required />
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" onclick={() => showGenerate = false}>
                {$t.cardsAdmin.cancel}
              </button>
              <button type="submit" class="submit-btn" disabled={generating}>
                {generating ? $t.cardsAdmin.generating : $t.cardsAdmin.generateCard}
              </button>
            </div>
          </form>
        {/if}
      </div>
    {/if}

    {#if loading}
      <div class="loading">{$t.cardsAdmin.loading}</div>
    {:else}
      <div class="cards-table">
        <table>
          <thead>
            <tr>
              <th>{$t.rechargeCard.code}</th>
              <th>{$t.rechargeCard.amount}</th>
              <th>{$t.cardsAdmin.status}</th>
              <th>{$t.cardsAdmin.created}</th>
              <th>{$t.cardsAdmin.usedAt}</th>
              <th>{$t.cardsAdmin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {#each cards as card}
              <tr class:used={card.used}>
                <td class="code">
                  <span>{card.code}</span>
                  <button
                    class="copy-btn-small"
                    onclick={() => copyCodeOnly(card.code)}
                    title={$t.cardsAdmin.copyCode}
                  >
                    {#if copiedCode === card.code}
                      <Check size={12} />
                    {:else}
                      <Copy size={12} />
                    {/if}
                  </button>
                </td>
                <td class="amount">${card.amount}</td>
                <td>
                  {#if card.used}
                    <span class="status">{$t.cardsAdmin.used}</span>
                  {:else if card.soldAt}
                    <span class="status sold">{$t.cardsAdmin.sold}</span>
                  {:else}
                    <span class="status active">{$t.cardsAdmin.available}</span>
                  {/if}
                </td>
                <td class="date">{formatDate(card.createdAt)}</td>
                <td class="date">{formatDate(card.usedAt)}</td>
                <td class="actions">
                  {#if !card.used && !card.soldAt}
                    <button
                      class="sell-btn"
                      onclick={() => markAsSold(card.code)}
                      disabled={markingAsSold === card.code}
                    >
                      <ShoppingCart size={14} />
                      <span>{markingAsSold === card.code ? '...' : $t.cardsAdmin.markAsSold}</span>
                    </button>
                  {:else if card.soldAt && !card.used}
                    <span class="sold-label">{$t.cardsAdmin.sold}</span>
                  {:else}
                    -
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
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

  [dir="rtl"] .sidebar {
    border-right: none;
    border-left: 1px solid #333;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .top-bar h1 {
    margin: 0;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(180deg, #00cc00 0%, #008800 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
  }

  .stats-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat .label {
    color: #888;
    font-size: 0.8em;
  }

  .stat .value {
    color: #fff;
    font-size: 1.3em;
    font-weight: bold;
  }

  .stat .value.green {
    color: #00cc00;
  }

  .stat .value.gold {
    color: #ffd700;
  }

  .generate-panel {
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid #ffd700;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .generate-panel h3 {
    margin: 0 0 20px 0;
    color: #ffd700;
  }

  .form-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
  }

  .form-grid.single {
    max-width: 200px;
  }

  .form-grid label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1 1 140px;
    min-width: 140px;
  }

  .form-grid label span {
    color: #888;
    font-size: 0.9em;
  }

  .form-grid input {
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
    border-radius: 8px;
    color: #fff;
    font-size: 1em;
  }

  .form-grid input:focus {
    border-color: #ffd700;
    outline: none;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .cancel-btn {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
    border-radius: 8px;
    color: #aaa;
    cursor: pointer;
  }

  .submit-btn {
    padding: 12px 24px;
    background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
    border: none;
    border-radius: 8px;
    color: #000;
    font-weight: bold;
    cursor: pointer;
  }

  .generated-cards {
    text-align: center;
  }

  .cards-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .gen-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
    border-radius: 8px;
  }

  .gen-code {
    font-family: monospace;
    color: #ffd700;
    font-size: 1.1em;
    flex: 1;
    text-align: left;
    direction: ltr;
  }

  .gen-info {
    color: #888;
    font-size: 0.9em;
  }

  .copy-btn {
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
    border-radius: 6px;
    color: #aaa;
    cursor: pointer;
  }

  .copy-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .download-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 16px;
  }

  .download-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(100, 100, 255, 0.2);
    border: 1px solid #6666ff;
    border-radius: 8px;
    color: #8888ff;
    cursor: pointer;
  }

  .download-btn.image {
    background: rgba(0, 200, 0, 0.2);
    border-color: #00cc00;
    color: #00cc00;
  }

  .download-btn:hover {
    transform: scale(1.02);
  }

  .close-btn {
    padding: 10px 30px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
    border-radius: 8px;
    color: #aaa;
    cursor: pointer;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #888;
  }

  .cards-table {
    background: rgba(30, 30, 50, 0.8);
    border-radius: 12px;
    border: 1px solid #333;
    overflow: hidden;
    flex: 1;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid #333;
  }

  [dir="rtl"] th, [dir="rtl"] td {
    text-align: right;
  }

  th {
    background: rgba(0, 0, 0, 0.3);
    color: #888;
    font-size: 0.85em;
    font-weight: normal;
  }

  td {
    color: #fff;
  }

  tr.used td {
    opacity: 0.5;
  }

  .code {
    font-family: monospace;
    color: #ffd700;
    direction: ltr;
  }

  .code span {
    margin-right: 8px;
  }

  .copy-btn-small {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
    border-radius: 4px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s;
    vertical-align: middle;
  }

  .copy-btn-small:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  tr.used .copy-btn-small {
    opacity: 1;
  }

  .amount {
    color: #00cc00;
    font-weight: bold;
  }

  .date {
    color: #888;
    font-size: 0.85em;
  }

  .status {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid #ff4444;
    border-radius: 12px;
    color: #ff6666;
    font-size: 0.8em;
  }

  .status.active {
    background: rgba(0, 200, 0, 0.2);
    border-color: #00cc00;
    color: #00cc00;
  }

  .status.sold {
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    color: #ffd700;
  }

  .actions {
    min-width: 120px;
  }

  .sell-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid #ffd700;
    border-radius: 6px;
    color: #ffd700;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sell-btn:hover:not(:disabled) {
    background: rgba(255, 215, 0, 0.3);
  }

  .sell-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .sold-label {
    color: #888;
    font-size: 0.85em;
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

    [dir="rtl"] .sidebar {
      border-left: none;
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

    .top-bar {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    .stats-row {
      justify-content: center;
    }

    .cards-table {
      overflow-x: auto;
    }

    .download-actions {
      flex-direction: column;
    }
  }

  @media (min-width: 1200px) {
    .stats-row {
      gap: 40px;
    }

    .generate-panel {
      max-width: 800px;
    }
  }
</style>
