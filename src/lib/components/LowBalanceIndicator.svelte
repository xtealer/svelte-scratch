<script lang="ts">
  import { AlertTriangle } from 'lucide-svelte';

  let {
    credits,
    threshold = 3,
    betSize = 1,
    showAllIn = true,
  }: {
    credits: number;
    threshold?: number;
    betSize?: number;
    showAllIn?: boolean;
  } = $props();

  let isLow = $derived(credits > 0 && credits <= threshold);
  let isAllIn = $derived(showAllIn && credits > 0 && credits === betSize);
  let isEmpty = $derived(credits === 0);
</script>

{#if isEmpty}
  <div class="balance-indicator empty">
    <AlertTriangle size={14} />
    <span>No Credits</span>
  </div>
{:else if isAllIn}
  <div class="balance-indicator all-in">
    <span class="pulse-dot"></span>
    <span>ALL IN!</span>
  </div>
{:else if isLow}
  <div class="balance-indicator low">
    <AlertTriangle size={14} />
    <span>Low Balance</span>
  </div>
{/if}

<style>
  .balance-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75em;
    font-weight: bold;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  .balance-indicator.low {
    background: rgba(255, 165, 0, 0.2);
    border: 1px solid rgba(255, 165, 0, 0.5);
    color: #ffa500;
  }

  .balance-indicator.all-in {
    background: rgba(255, 0, 100, 0.2);
    border: 1px solid rgba(255, 0, 100, 0.5);
    color: #ff0064;
    animation: allInPulse 1.5s ease-in-out infinite;
  }

  @keyframes allInPulse {
    0%, 100% {
      box-shadow: 0 0 5px rgba(255, 0, 100, 0.3);
    }
    50% {
      box-shadow: 0 0 15px rgba(255, 0, 100, 0.6);
    }
  }

  .balance-indicator.empty {
    background: rgba(255, 68, 68, 0.2);
    border: 1px solid rgba(255, 68, 68, 0.5);
    color: #ff4444;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background: #ff0064;
    border-radius: 50%;
    animation: pulseDot 1s ease-in-out infinite;
  }

  @keyframes pulseDot {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.7;
    }
  }

  .balance-indicator :global(svg) {
    flex-shrink: 0;
  }
</style>
