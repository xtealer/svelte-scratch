<script lang="ts">
  import { t } from "$lib/i18n";
  import { hasActiveSession, playerWallet } from "$lib/stores/playerWallet";
  import { AlertTriangle } from "lucide-svelte";

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
  let showSessionWarning = $state(false);
  let pendingCode = $state("");

  function close(): void {
    show = false;
    code = "";
    error = "";
    showSessionWarning = false;
    pendingCode = "";
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

    const trimmedCode = code.trim().toUpperCase();

    // Check if there's an active session with balance
    if ($hasActiveSession && ($playerWallet.credits > 0 || $playerWallet.winnings > 0)) {
      pendingCode = trimmedCode;
      showSessionWarning = true;
      return;
    }

    await submitCode(trimmedCode);
  }

  async function submitCode(codeToSubmit: string): Promise<void> {
    loading = true;
    error = "";

    try {
      await onCodeSubmit(codeToSubmit);
      close();
    } catch (e) {
      error = e instanceof Error ? e.message : "Invalid code";
    } finally {
      loading = false;
    }
  }

  function confirmReplaceSession(): void {
    showSessionWarning = false;
    submitCode(pendingCode);
  }

  function cancelReplaceSession(): void {
    showSessionWarning = false;
    pendingCode = "";
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !showSessionWarning) {
      handleSubmit();
    } else if (event.key === "Escape") {
      if (showSessionWarning) {
        cancelReplaceSession();
      } else {
        close();
      }
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      {#if showSessionWarning}
        <!-- Session Warning View -->
        <div class="warning-view">
          <div class="warning-icon">
            <AlertTriangle size={40} />
          </div>
          <div class="modal-header warning">{$t.codeModal.activeSessionTitle}</div>
          <div class="warning-info">
            <p>{$t.codeModal.activeSessionWarning}</p>
            <div class="session-details">
              <div class="detail-row">
                <span class="detail-label">{$t.codeModal.currentCode}:</span>
                <span class="detail-value code">{$playerWallet.code}</span>
              </div>
              {#if $playerWallet.credits > 0}
                <div class="detail-row">
                  <span class="detail-label">{$t.codeModal.creditsLeft}:</span>
                  <span class="detail-value credits">${$playerWallet.credits}</span>
                </div>
              {/if}
              {#if $playerWallet.winnings > 0}
                <div class="detail-row">
                  <span class="detail-label">{$t.codeModal.unclaimedWinnings}:</span>
                  <span class="detail-value winnings">${$playerWallet.winnings.toFixed(2)}</span>
                </div>
              {/if}
            </div>
            <p class="warning-text">{$t.codeModal.loseBalanceWarning}</p>
          </div>
          <div class="buttons">
            <button class="submit-btn warning-btn" onclick={confirmReplaceSession}>
              {$t.codeModal.continueAnyway}
            </button>
            <button class="cancel-btn" onclick={cancelReplaceSession}>
              {$t.codeModal.keepSession}
            </button>
          </div>
        </div>
      {:else}
        <!-- Normal Code Entry View -->
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
      {/if}
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
    background: linear-gradient(#1a2c38, #213743);
    border: 3px solid #00e701;
    border-radius: 16px;
    padding: 20px 16px;
    width: 100%;
    max-width: 360px;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    box-shadow: 0 0 30px rgba(0, 231, 1, 0.3);
  }

  .modal-header {
    font-size: 1.3em;
    margin-bottom: 16px;
    text-shadow: 0 0 10px rgba(0, 231, 1, 0.5);
    color: #00e701;
    text-align: center;
  }

  .modal-header.warning {
    color: #ffa500;
    text-shadow: 0 0 10px #ffa500;
  }

  .warning-view {
    text-align: center;
  }

  .warning-icon {
    color: #ffa500;
    margin-bottom: 12px;
  }

  .warning-info {
    margin-bottom: 16px;
  }

  .warning-info p {
    color: #b1bad3;
    font-size: 0.9em;
    margin: 0 0 12px 0;
    line-height: 1.4;
  }

  .session-details {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #2d4a5e;
    border-radius: 10px;
    padding: 12px;
    margin: 12px 0;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
  }

  .detail-row:not(:last-child) {
    border-bottom: 1px solid #333;
  }

  .detail-label {
    color: #888;
    font-size: 0.85em;
  }

  .detail-value {
    font-weight: bold;
    font-size: 0.95em;
  }

  .detail-value.code {
    color: #00e701;
  }

  .detail-value.credits {
    color: #00bfff;
  }

  .detail-value.winnings {
    color: #00e701;
  }

  .warning-text {
    color: #ff6666 !important;
    font-weight: bold;
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
    background: #0f1923;
    border: 2px solid #555;
    border-radius: 10px;
    color: #00e701;
    letter-spacing: 2px;
  }

  input:focus {
    outline: none;
    border-color: #00e701;
    box-shadow: 0 0 10px rgba(0, 231, 1, 0.3);
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
    background: linear-gradient(#00e701, #00b301);
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }

  .submit-btn.warning-btn {
    background: linear-gradient(#ffa500, #cc7000);
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
    background: linear-gradient(#2d4a5e, #1a2c38);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
  }

  .cancel-btn:active:not(:disabled) {
    transform: scale(0.98);
    background: linear-gradient(#3d5a6e, #2d4a5e);
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
