<script lang="ts">
  let {
    show = $bindable(false),
    scratchCode,
    totalWinnings,
  }: {
    show: boolean;
    scratchCode: string;
    totalWinnings: number;
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

      <button class="close-btn" onclick={close}>Cerrar</button>
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
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
  }

  .modal-content {
    background: linear-gradient(#222, #333);
    border: 3px solid #ffd700;
    border-radius: 20px;
    padding: 25px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 0 30px #ff0;
    text-align: center;
  }

  .modal-header {
    font-size: 1.6em;
    margin-bottom: 20px;
    text-shadow: 0 0 10px #ff0;
    color: #ffd700;
  }

  .winnings {
    background: linear-gradient(#1a1a1a, #0d0d0d);
    border: 2px solid #ffd700;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .winnings .label {
    display: block;
    color: #aaa;
    font-size: 1em;
    margin-bottom: 5px;
  }

  .winnings .amount {
    display: block;
    color: #00ff00;
    font-size: 2.5em;
    font-weight: bold;
    text-shadow: 0 0 15px #0f0;
  }

  .qr-container {
    background: #fff;
    padding: 15px;
    border-radius: 15px;
    display: inline-block;
    margin-bottom: 20px;
  }

  .qr-code {
    display: block;
    width: 200px;
    height: 200px;
  }

  .code-display {
    margin-bottom: 20px;
  }

  .code-display .label {
    display: block;
    color: #aaa;
    font-size: 0.9em;
    margin-bottom: 5px;
  }

  .code-display .code {
    display: block;
    color: #ffd700;
    font-size: 1.8em;
    font-weight: bold;
    letter-spacing: 3px;
  }

  .info {
    color: #aaa;
    font-size: 0.9em;
    line-height: 1.5;
    margin-bottom: 20px;
  }

  .info p {
    margin: 5px 0;
  }

  .close-btn {
    padding: 15px;
    font-size: 1.4em;
    width: 100%;
    background: linear-gradient(#ffd700, #b8860b);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }

  .close-btn:hover {
    transform: scale(1.03);
  }

  @media (max-width: 480px) {
    .modal-content {
      padding: 20px;
    }
    .modal-header {
      font-size: 1.4em;
    }
    .winnings .amount {
      font-size: 2em;
    }
    .qr-code {
      width: 160px;
      height: 160px;
    }
  }
</style>
