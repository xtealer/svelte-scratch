<script lang="ts">
  let {
    show = $bindable(false),
    scratchCode,
    totalWinnings,
    onPlayMore,
  }: {
    show: boolean;
    scratchCode: string;
    totalWinnings: number;
    onPlayMore?: () => void;
  } = $props();

  // Generate QR code URL using goqr.me API
  let qrCodeUrl = $derived(
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scratchCode)}`
  );

  function close(): void {
    show = false;
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handlePlayMore(): void {
    if (onPlayMore) {
      onPlayMore();
    }
    close();
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">COBRA TU PREMIO</div>

      <div class="winnings">
        <span class="label">Ganancias Totales</span>
        <span class="amount">${totalWinnings.toFixed(2)}</span>
      </div>

      <div class="qr-container">
        <img src={qrCodeUrl} alt="Código QR para {scratchCode}" class="qr-code" />
      </div>

      <div class="code-display">
        <span class="label">Código</span>
        <span class="code">{scratchCode}</span>
      </div>

      <div class="info">
        <p>Muestra este código QR para cobrar tus ganancias.</p>
        <p>Guarda este código hasta cobrar tu premio.</p>
      </div>

      <div class="button-group">
        {#if onPlayMore}
          <button class="play-more-btn" onclick={handlePlayMore}>
            Seguir Jugando
          </button>
        {/if}
        <button class="close-btn" onclick={close}>Cerrar</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    z-index: 100;
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
    background: linear-gradient(#222, #333);
    border: 3px solid #ffd700;
    border-radius: 16px;
    padding: 20px 16px;
    width: 100%;
    max-width: 360px;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    box-shadow: 0 0 30px #ff0;
    text-align: center;
  }

  .modal-header {
    font-size: 1.4em;
    margin-bottom: 12px;
    text-shadow: 0 0 10px #ff0;
    color: #ffd700;
  }

  .winnings {
    background: linear-gradient(#1a1a1a, #0d0d0d);
    border: 2px solid #ffd700;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .winnings .label {
    display: block;
    color: #aaa;
    font-size: 0.85em;
    margin-bottom: 4px;
  }

  .winnings .amount {
    display: block;
    color: #00ff00;
    font-size: 2em;
    font-weight: bold;
    text-shadow: 0 0 15px #0f0;
  }

  .qr-container {
    background: #fff;
    padding: 10px;
    border-radius: 12px;
    display: inline-block;
    margin-bottom: 12px;
  }

  .qr-code {
    display: block;
    width: 140px;
    height: 140px;
  }

  .code-display {
    margin-bottom: 12px;
  }

  .code-display .label {
    display: block;
    color: #aaa;
    font-size: 0.8em;
    margin-bottom: 4px;
  }

  .code-display .code {
    display: block;
    color: #ffd700;
    font-size: 1.1em;
    font-weight: bold;
    letter-spacing: 1px;
    word-break: break-all;
    padding: 0 8px;
  }

  .info {
    color: #aaa;
    font-size: 0.8em;
    line-height: 1.4;
    margin-bottom: 12px;
  }

  .info p {
    margin: 4px 0;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .play-more-btn {
    padding: 12px;
    font-size: 1.2em;
    width: 100%;
    background: linear-gradient(#00cc00, #008800);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  }

  .play-more-btn:active {
    transform: scale(0.98);
  }

  .close-btn {
    padding: 12px;
    font-size: 1.2em;
    width: 100%;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }

  .close-btn:active {
    transform: scale(0.98);
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 24px 20px;
    }
    .modal-header {
      font-size: 1.5em;
      margin-bottom: 16px;
    }
    .winnings {
      padding: 16px;
      margin-bottom: 16px;
    }
    .winnings .amount {
      font-size: 2.2em;
    }
    .qr-code {
      width: 160px;
      height: 160px;
    }
    .code-display .code {
      font-size: 1.3em;
      letter-spacing: 2px;
    }
    .info {
      font-size: 0.85em;
    }
    .close-btn {
      padding: 14px;
      font-size: 1.3em;
    }
  }
</style>
