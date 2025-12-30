<script lang="ts">
  let {
    show = $bindable(false),
    onCodeSubmit,
  }: {
    show: boolean;
    onCodeSubmit: (code: string) => Promise<void>;
  } = $props();

  let code = $state("");
  let loading = $state(false);
  let error = $state("");

  function close(): void {
    show = false;
    code = "";
    error = "";
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!code.trim()) {
      error = "Por favor ingresa un código";
      return;
    }

    loading = true;
    error = "";

    try {
      await onCodeSubmit(code.trim().toUpperCase());
      close();
    } catch (e) {
      error = e instanceof Error ? e.message : "Invalid code";
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      handleSubmit();
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">INGRESAR CÓDIGO</div>

      <div class="input-group">
        <input
          type="text"
          bind:value={code}
          placeholder="Ingresa código (ej: ABC123)"
          onkeydown={handleKeydown}
          disabled={loading}
          maxlength="20"
        />
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="info">
        <p>Ingresa el código de tu boleto para cargar tus jugadas.</p>
        <p>Cada código puede tener varias jugadas.</p>
      </div>

      <div class="buttons">
        <button class="submit-btn" onclick={handleSubmit} disabled={loading}>
          {loading ? "Cargando..." : "Cargar Jugadas"}
        </button>
        <button class="cancel-btn" onclick={close} disabled={loading}>
          Cancelar
        </button>
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
  }

  .modal-header {
    font-size: 1.6em;
    margin-bottom: 20px;
    text-shadow: 0 0 10px #ff0;
    color: #ffd700;
    text-align: center;
  }

  .input-group {
    margin-bottom: 15px;
  }

  input {
    width: 100%;
    padding: 15px;
    font-size: 1.4em;
    text-align: center;
    text-transform: uppercase;
    background: #111;
    border: 2px solid #555;
    border-radius: 10px;
    color: #ffd700;
    letter-spacing: 3px;
  }

  input:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }

  input::placeholder {
    color: #666;
    letter-spacing: 1px;
    text-transform: none;
  }

  input:disabled {
    opacity: 0.6;
  }

  .error {
    color: #ff4444;
    text-align: center;
    margin-bottom: 15px;
    font-size: 1.1em;
  }

  .info {
    text-align: center;
    color: #aaa;
    margin-bottom: 20px;
    font-size: 0.95em;
    line-height: 1.5;
  }

  .info p {
    margin: 5px 0;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .submit-btn {
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

  .submit-btn:hover:not(:disabled) {
    transform: scale(1.03);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cancel-btn {
    padding: 12px;
    font-size: 1.2em;
    width: 100%;
    background: linear-gradient(#555, #333);
    color: #fff;
    border: none;
    border-radius: 12px;
    cursor: pointer;
  }

  .cancel-btn:hover:not(:disabled) {
    background: linear-gradient(#666, #444);
  }

  .cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    .modal-content {
      padding: 20px;
    }
    .modal-header {
      font-size: 1.4em;
    }
    input {
      font-size: 1.2em;
      padding: 12px;
    }
  }
</style>
