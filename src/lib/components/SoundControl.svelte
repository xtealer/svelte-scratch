<script lang="ts">
  import { Volume2, VolumeX, Volume1 } from 'lucide-svelte';

  let {
    muted = $bindable(false),
    volume = $bindable(1),
    showSlider = false,
    size = 20,
    onToggle,
    onVolumeChange,
  }: {
    muted: boolean;
    volume?: number;
    showSlider?: boolean;
    size?: number;
    onToggle?: (muted: boolean) => void;
    onVolumeChange?: (volume: number) => void;
  } = $props();

  let showVolumeSlider = $state(false);

  function toggleMute(): void {
    muted = !muted;
    if (onToggle) onToggle(muted);
  }

  function handleVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    volume = parseFloat(target.value);
    if (volume > 0 && muted) {
      muted = false;
      if (onToggle) onToggle(false);
    }
    if (onVolumeChange) onVolumeChange(volume);
  }

  function toggleSlider(): void {
    if (showSlider) {
      showVolumeSlider = !showVolumeSlider;
    } else {
      toggleMute();
    }
  }

  let VolumeIcon = $derived(() => {
    if (muted || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  });
</script>

<div class="sound-control" class:has-slider={showSlider && showVolumeSlider}>
  <button
    class="sound-btn"
    class:muted
    onclick={toggleSlider}
    oncontextmenu={(e) => { e.preventDefault(); if (showSlider) toggleMute(); }}
    title={muted ? 'Unmute' : 'Mute'}
  >
    <svelte:component this={VolumeIcon()} {size} />
  </button>

  {#if showSlider && showVolumeSlider}
    <div class="volume-slider-container">
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        oninput={handleVolumeChange}
        class="volume-slider"
      />
      <button class="mute-btn" onclick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
        {#if muted}
          <VolumeX size={14} />
        {:else}
          <Volume2 size={14} />
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .sound-control {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .sound-btn {
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid #ffd700;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
  }

  .sound-btn:hover {
    transform: scale(1.1);
    background: rgba(255, 215, 0, 0.3);
  }

  .sound-btn:active {
    transform: scale(0.95);
  }

  .sound-btn.muted {
    opacity: 0.6;
  }

  .sound-btn :global(svg) {
    color: #ffd700;
  }

  .volume-slider-container {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid #ffd700;
    border-radius: 8px;
    padding: 12px 10px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 80px;
    height: 6px;
    background: #333;
    border-radius: 3px;
    outline: none;
    transform: rotate(-90deg);
    transform-origin: center;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #ffd700;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.1s;
  }

  .volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .volume-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #ffd700;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .mute-btn {
    background: #333;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 4px 8px;
    color: #ffd700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mute-btn:hover {
    background: #444;
    border-color: #ffd700;
  }

  @media (max-width: 480px) {
    .sound-btn {
      width: 36px;
      height: 36px;
    }
  }
</style>
