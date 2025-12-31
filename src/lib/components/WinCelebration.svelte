<script lang="ts">
  import { onMount } from 'svelte';

  type WinLevel = 'normal' | 'big' | 'mega';

  let {
    show = $bindable(false),
    amount = 0,
    level = 'normal' as WinLevel,
    duration = 3000,
    onComplete,
  }: {
    show: boolean;
    amount: number;
    level?: WinLevel;
    duration?: number;
    onComplete?: () => void;
  } = $props();

  let particles = $state<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    delay: number;
  }>>([]);

  const colors = {
    normal: ['#ffd700', '#ffb700', '#ff9500'],
    big: ['#ffd700', '#00ff00', '#00e701', '#ffb700'],
    mega: ['#ffd700', '#ff00ff', '#00ffff', '#ff0000', '#00ff00', '#ff6600']
  };

  function generateParticles() {
    const count = level === 'mega' ? 50 : level === 'big' ? 30 : 15;
    const colorSet = colors[level];

    particles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      color: colorSet[Math.floor(Math.random() * colorSet.length)],
      delay: Math.random() * 0.5
    }));
  }

  $effect(() => {
    if (show) {
      generateParticles();

      const timer = setTimeout(() => {
        show = false;
        particles = [];
        if (onComplete) onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  });

  const levelStyles = {
    normal: {
      textShadow: '0 0 20px #ffd700, 0 0 40px #ffd700',
      color: '#ffd700'
    },
    big: {
      textShadow: '0 0 20px #00ff00, 0 0 40px #00ff00, 0 0 60px #00ff00',
      color: '#00ff00'
    },
    mega: {
      textShadow: '0 0 20px #ff00ff, 0 0 40px #00ffff, 0 0 60px #ffd700',
      color: '#fff'
    }
  };
</script>

{#if show}
  <div class="celebration-overlay" class:big={level === 'big'} class:mega={level === 'mega'}>
    <!-- Confetti particles -->
    <div class="particles">
      {#each particles as particle (particle.id)}
        <div
          class="particle"
          style="
            left: {particle.x}%;
            top: {particle.y}%;
            background: {particle.color};
            transform: rotate({particle.rotation}deg) scale({particle.scale});
            animation-delay: {particle.delay}s;
          "
        />
      {/each}
    </div>

    <!-- Win amount display -->
    <div class="win-content" style="color: {levelStyles[level].color}; text-shadow: {levelStyles[level].textShadow}">
      {#if level === 'mega'}
        <div class="mega-label">MEGA WIN!</div>
      {:else if level === 'big'}
        <div class="big-label">BIG WIN!</div>
      {:else}
        <div class="normal-label">WIN!</div>
      {/if}
      <div class="win-amount">${amount}</div>
    </div>
  </div>
{/if}

<style>
  .celebration-overlay {
    position: fixed;
    z-index: 150;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.7);
    animation: overlayIn 0.3s ease-out;
    pointer-events: none;
  }

  @keyframes overlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    animation: fall 2.5s ease-out forwards;
  }

  @keyframes fall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(110vh) rotate(720deg);
      opacity: 0;
    }
  }

  .win-content {
    text-align: center;
    animation: winPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 10;
  }

  @keyframes winPop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .normal-label {
    font-size: 2em;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .big-label {
    font-size: 2.5em;
    font-weight: bold;
    margin-bottom: 10px;
    animation: bigPulse 0.5s ease-in-out infinite alternate;
  }

  .mega-label {
    font-size: 3em;
    font-weight: bold;
    margin-bottom: 10px;
    background: linear-gradient(45deg, #ff00ff, #00ffff, #ffd700, #ff00ff);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: megaGradient 1s linear infinite, megaPulse 0.3s ease-in-out infinite alternate;
  }

  @keyframes bigPulse {
    from { transform: scale(1); }
    to { transform: scale(1.1); }
  }

  @keyframes megaPulse {
    from { transform: scale(1); }
    to { transform: scale(1.15); }
  }

  @keyframes megaGradient {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }

  .win-amount {
    font-size: 4em;
    font-weight: bold;
    animation: amountBounce 0.8s ease-out;
  }

  .big .win-amount {
    font-size: 5em;
  }

  .mega .win-amount {
    font-size: 5.5em;
    background: linear-gradient(45deg, #ffd700, #fff, #ffd700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @keyframes amountBounce {
    0% { transform: translateY(-50px); opacity: 0; }
    50% { transform: translateY(10px); }
    100% { transform: translateY(0); opacity: 1; }
  }

  @media (max-width: 480px) {
    .normal-label {
      font-size: 1.5em;
    }

    .big-label {
      font-size: 2em;
    }

    .mega-label {
      font-size: 2.5em;
    }

    .win-amount {
      font-size: 3em;
    }

    .big .win-amount {
      font-size: 3.5em;
    }

    .mega .win-amount {
      font-size: 4em;
    }
  }
</style>
