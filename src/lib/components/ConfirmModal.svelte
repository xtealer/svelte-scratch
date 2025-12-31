<script lang="ts">
  import { AlertTriangle, Info, CheckCircle } from 'lucide-svelte';

  type ModalType = 'warning' | 'info' | 'success';

  let {
    show = $bindable(false),
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning' as ModalType,
    onConfirm,
    onCancel,
  }: {
    show: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: ModalType;
    onConfirm?: () => void;
    onCancel?: () => void;
  } = $props();

  function close(): void {
    show = false;
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleConfirm(): void {
    if (onConfirm) onConfirm();
    close();
  }

  function handleCancel(): void {
    if (onCancel) onCancel();
    close();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter') {
      handleConfirm();
    }
  }

  const iconColors = {
    warning: '#ffa500',
    info: '#00bfff',
    success: '#00e701'
  };

  const buttonColors = {
    warning: 'linear-gradient(#ffa500, #cc7000)',
    info: 'linear-gradient(#00bfff, #0088cc)',
    success: 'linear-gradient(#00e701, #00b301)'
  };
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={handleBackdropClick}>
    <div class="modal-content" class:warning={type === 'warning'} class:info={type === 'info'} class:success={type === 'success'}>
      <div class="modal-icon" style="color: {iconColors[type]}">
        {#if type === 'warning'}
          <AlertTriangle size={40} />
        {:else if type === 'info'}
          <Info size={40} />
        {:else}
          <CheckCircle size={40} />
        {/if}
      </div>

      <h2 class="modal-title">{title}</h2>
      <p class="modal-message">{message}</p>

      <div class="modal-buttons">
        <button
          class="confirm-btn"
          style="background: {buttonColors[type]}"
          onclick={handleConfirm}
        >
          {confirmText}
        </button>
        <button class="cancel-btn" onclick={handleCancel}>
          {cancelText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    z-index: 200;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 2px solid #ffa500;
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 360px;
    text-align: center;
    box-shadow: 0 0 30px rgba(255, 165, 0, 0.3);
    animation: slideIn 0.2s ease-out;
  }

  .modal-content.warning {
    border-color: #ffa500;
    box-shadow: 0 0 30px rgba(255, 165, 0, 0.3);
  }

  .modal-content.info {
    border-color: #00bfff;
    box-shadow: 0 0 30px rgba(0, 191, 255, 0.3);
  }

  .modal-content.success {
    border-color: #00e701;
    box-shadow: 0 0 30px rgba(0, 231, 1, 0.3);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-icon {
    margin-bottom: 16px;
  }

  .modal-title {
    font-size: 1.3em;
    color: #fff;
    margin: 0 0 12px 0;
    font-weight: bold;
  }

  .modal-message {
    font-size: 0.95em;
    color: #b1bad3;
    margin: 0 0 20px 0;
    line-height: 1.5;
  }

  .modal-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .confirm-btn {
    padding: 14px 24px;
    font-size: 1.1em;
    font-weight: bold;
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.2s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .confirm-btn:hover {
    transform: scale(1.02);
  }

  .confirm-btn:active {
    transform: scale(0.98);
  }

  .cancel-btn {
    padding: 12px 20px;
    font-size: 1em;
    color: #888;
    background: transparent;
    border: 1px solid #444;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #aaa;
    border-color: #555;
  }

  @media (max-width: 400px) {
    .modal-content {
      padding: 20px 16px;
    }

    .modal-title {
      font-size: 1.2em;
    }

    .modal-message {
      font-size: 0.9em;
    }
  }
</style>
