<script lang="ts">
  import { onMount } from 'svelte';
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
    FileText
  } from 'lucide-svelte';

  interface Card {
    _id: string;
    code: string;
    amount: number;
    used: boolean;
    usedAt?: string;
    createdAt: string;
    soldAt?: string;
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

  onMount(async () => {
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

  async function copyCode(code: string, amount: number) {
    const message = `🎰 TARJETA DE RECARGA 🎰\n\nCódigo: ${code}\nMonto: $${amount}\n\nIngresa este código en el juego para recargar tu saldo.\n¡Buena suerte!`;
    await navigator.clipboard.writeText(message);
    copiedCode = code;
    setTimeout(() => copiedCode = null, 2000);
  }

  function downloadAsText() {
    if (!generatedCard) return;
    const text = `🎰 TARJETA DE RECARGA 🎰

Código: ${generatedCard.code}
Monto: $${generatedCard.amount}

Ingresa este código en el juego para recargar tu saldo.
¡Buena suerte!`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recharge-card-${generatedCard.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadAsImage() {
    if (!generatedCard) return;
    const card = generatedCard; // Capture for closure

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

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('🎰 TARJETA DE RECARGA', x + 20, y + 35);

    // Code label
    ctx.fillStyle = '#888888';
    ctx.font = '12px Arial';
    ctx.fillText('CÓDIGO:', x + 20, y + 65);

    // Code
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(card.code, x + 20, y + 85);

    // Amount
    ctx.fillStyle = '#00cc00';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`$${card.amount}`, x + 20, y + 130);

    // Instructions
    ctx.fillStyle = '#888888';
    ctx.font = '11px Arial';
    ctx.fillText('Escanea el QR o ingresa el código', x + 20, y + 160);
    ctx.fillText('en el juego para recargar', x + 20, y + 175);

    // Draw QR code on the right side
    const qrSize = 130;
    const qrX = x + cardWidth - qrSize - 15;
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
</script>

<div class="admin-container">
  <nav class="sidebar">
    <div class="sidebar-header">
      <h2>Casino Admin</h2>
    </div>

    <ul class="nav-menu">
      <li>
        <a href="/admin/dashboard">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </a>
      </li>
    </ul>
  </nav>

  <main class="main-content">
    <header class="top-bar">
      <h1>
        <CreditCard size={28} />
        <span>Recharge Cards</span>
      </h1>
      <button class="add-btn" onclick={() => { showGenerate = true; generatedCard = null; }}>
        <Plus size={20} />
        <span>Generate Card</span>
      </button>
    </header>

    {#if stats}
      <div class="stats-row">
        <div class="stat">
          <span class="label">Total</span>
          <span class="value">{stats.total}</span>
        </div>
        <div class="stat">
          <span class="label">Unused</span>
          <span class="value green">{stats.unused}</span>
        </div>
        <div class="stat">
          <span class="label">Used</span>
          <span class="value">{stats.used}</span>
        </div>
        <div class="stat">
          <span class="label">Sold</span>
          <span class="value gold">{stats.sold}</span>
        </div>
        <div class="stat">
          <span class="label">Total Value</span>
          <span class="value">${stats.totalValue.toFixed(2)}</span>
        </div>
        <div class="stat">
          <span class="label">Sold Value</span>
          <span class="value green">${stats.soldValue.toFixed(2)}</span>
        </div>
      </div>
    {/if}

    {#if showGenerate}
      <div class="generate-panel">
        {#if generatedCard}
          <div class="generated-cards">
            <h3>Card Generated</h3>
            <div class="cards-list">
              <div class="gen-card">
                <span class="gen-code">{generatedCard.code}</span>
                <span class="gen-info">${generatedCard.amount}</span>
                <button
                  class="copy-btn"
                  onclick={() => copyCode(generatedCard!.code, generatedCard!.amount)}
                  title="Copy with message"
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
              <button class="download-btn" onclick={downloadAsText}>
                <FileText size={18} />
                <span>Download as Text</span>
              </button>
              <button class="download-btn image" onclick={downloadAsImage}>
                <Image size={18} />
                <span>Download as Image</span>
              </button>
            </div>
            <button class="close-btn" onclick={closeGenerated}>Close</button>
          </div>
        {:else}
          <h3>Generate Recharge Card</h3>
          <form onsubmit={generateCard}>
            <div class="form-grid single">
              <label>
                <span>Amount ($)</span>
                <input type="number" bind:value={genAmount} min="1" max="1000" step="1" required />
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" onclick={() => showGenerate = false}>
                Cancel
              </button>
              <button type="submit" class="submit-btn" disabled={generating}>
                {generating ? 'Generating...' : 'Generate Card'}
              </button>
            </div>
          </form>
        {/if}
      </div>
    {/if}

    {#if loading}
      <div class="loading">Loading cards...</div>
    {:else}
      <div class="cards-table">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Used At</th>
            </tr>
          </thead>
          <tbody>
            {#each cards as card}
              <tr class:used={card.used}>
                <td class="code">{card.code}</td>
                <td class="amount">${card.amount}</td>
                <td>
                  <span class="status" class:active={!card.used}>
                    {card.used ? 'Used' : 'Available'}
                  </span>
                </td>
                <td class="date">{formatDate(card.createdAt)}</td>
                <td class="date">{formatDate(card.usedAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </main>
</div>

<style>
  .admin-container {
    display: flex;
    min-height: 100vh;
    background: #0f0f1a;
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
  }

  .nav-menu li a:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
