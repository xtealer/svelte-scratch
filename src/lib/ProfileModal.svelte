<script lang="ts">
  import { User, Mail, Wallet, ExternalLink } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import { playerUser } from '$lib/stores/playerAuth';

  let {
    show = $bindable(false),
  }: {
    show: boolean;
  } = $props();

  // Check if user is MetaMask-only (no email linked)
  let isMetamaskOnly = $derived($playerUser?.metamaskAddress && !$playerUser?.email);

  function close(): void {
    show = false;
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      close();
    }
  }

  function goToProfile(): void {
    close();
    window.location.href = '/profile';
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal" onclick={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">
        <User size={24} />
        <span>{$t.profile.title}</span>
      </div>

      <!-- User Info Section -->
      <div class="user-info-section">
        <div class="info-row">
          <User size={16} />
          <span class="info-label">{$t.authModal.fullName}:</span>
          <span class="info-value">{$playerUser?.fullName || '-'}</span>
        </div>

        {#if $playerUser?.email}
          <div class="info-row">
            <Mail size={16} />
            <span class="info-label">{$t.authModal.email}:</span>
            <span class="info-value">{$playerUser.email}</span>
          </div>
        {/if}

        {#if $playerUser?.metamaskAddress}
          <div class="info-row">
            <Wallet size={16} />
            <span class="info-label">{$t.profile.wallet}:</span>
            <span class="info-value wallet-address">
              {$playerUser.metamaskAddress.slice(0, 6)}...{$playerUser.metamaskAddress.slice(-4)}
            </span>
          </div>
        {/if}
      </div>

      {#if isMetamaskOnly}
        <div class="link-email-notice">
          <p>{$t.profile.linkEmailInfo}</p>
        </div>
      {/if}

      <div class="buttons">
        <button class="edit-btn" onclick={goToProfile}>
          <ExternalLink size={16} />
          <span>{$t.profile.editProfile}</span>
        </button>
        <button class="cancel-btn" onclick={close}>
          {$t.authModal.back}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    z-index: 1100;
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
    box-shadow: 0 0 30px rgba(0, 231, 1, 0.3);
  }

  .modal-header {
    font-size: 1.3em;
    margin-bottom: 20px;
    text-shadow: 0 0 10px rgba(0, 231, 1, 0.5);
    color: #00e701;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .user-info-section {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-row :global(svg) {
    color: #00bfff;
    flex-shrink: 0;
  }

  .info-label {
    color: #7f8c8d;
    font-size: 0.9em;
  }

  .info-value {
    color: #fff;
    font-weight: 500;
    margin-left: auto;
    text-align: right;
  }

  .wallet-address {
    font-family: monospace;
    color: #f6851b;
  }

  .link-email-notice {
    background: rgba(246, 133, 27, 0.15);
    border: 1px solid rgba(246, 133, 27, 0.3);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 16px;
  }

  .link-email-notice p {
    color: #f6851b;
    font-size: 0.9em;
    margin: 0;
    text-align: center;
    line-height: 1.4;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    font-size: 1.1em;
    width: 100%;
    background: linear-gradient(#00e701, #00b301);
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    transform: scale(1.02);
  }

  .edit-btn:active {
    transform: scale(0.98);
  }

  .cancel-btn {
    padding: 12px;
    font-size: 1em;
    width: 100%;
    background: linear-gradient(#2d4a5e, #1a2c38);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:active {
    transform: scale(0.98);
  }

  @media (min-width: 400px) {
    .modal-content {
      padding: 24px 20px;
    }
  }
</style>
