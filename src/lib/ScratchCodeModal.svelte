<script lang="ts">
  import { t } from "$lib/i18n";

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
      error = $t.codeModal.enterCodeError;
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
      <div class="modal-header">{$t.codeModal.title}</div>

      <div class="input-group">
        <input
          type="text"
          bind:value={code}
          placeholder={$t.codeModal.placeholder}
          onkeydown={handleKeydown}
          disabled={loading}
          maxlength="20"
        />
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="info">
        <p>{$t.codeModal.info1}</p>
        <p>{$t.codeModal.info2}</p>
      </div>

      <div class="buttons">
        <button class="submit-btn" onclick={handleSubmit} disabled={loading}>
          {loading ? $t.codeModal.loading : $t.codeModal.loadPlays}
        </button>
        <button class="cancel-btn" onclick={close} disabled={loading}>
          {$t.codeModal.cancel}
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
  }

  .modal-header {
    font-size: 1.3em;
    margin-bottom: 16px;
    text-shadow: 0 0 10px #ff0;
    color: #ffd700;
    text-align: center;
  }

  .input-group {
    margin-bottom: 12px;
  }

  input {
    width: 100%;
    padding: 14px 12px;
    font-size: 1.1em;
    text-align: center;
    text-transform: uppercase;
    background: #111;
    border: 2px solid #555;
    border-radius: 10px;
    color: #ffd700;
    letter-spacing: 2px;
  }

  input:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    font-size: 16px;
  }

  input::placeholder {
    color: #666;
    letter-spacing: 0;
    text-transform: none;
    font-size: 0.9em;
  }

  input:disabled {
    opacity: 0.6;
  }

  .error {
    color: #ff4444;
    text-align: center;
    margin-bottom: 12px;
    font-size: 0.95em;
  }

  .info {
    text-align: center;
    color: #aaa;
    margin-bottom: 16px;
    font-size: 0.85em;
    line-height: 1.4;
  }

  .info p {
    margin: 4px 0;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .submit-btn {
    padding: 14px;
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

  .submit-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cancel-btn {
    padding: 12px;
    font-size: 1.1em;
    width: 100%;
    background: linear-gradient(#555, #333);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
  }

  .cancel-btn:active:not(:disabled) {
    transform: scale(0.98);
    background: linear-gradient(#666, #444);
  }

  .cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 24px 20px;
    }
    .modal-header {
      font-size: 1.5em;
    }
    input {
      font-size: 1.2em;
      padding: 16px 14px;
    }
    .submit-btn {
      padding: 16px;
      font-size: 1.3em;
    }
    .cancel-btn {
      padding: 14px;
      font-size: 1.2em;
    }
  }
</style>
