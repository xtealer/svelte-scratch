<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
  :global(*) {
    box-sizing: border-box;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  :global(html) {
    overscroll-behavior: none;
  }

  :global(body) {
    margin: 0;
    padding: 10px;
    padding-top: max(10px, env(safe-area-inset-top));
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    padding-left: max(10px, env(safe-area-inset-left));
    padding-right: max(10px, env(safe-area-inset-right));
    font-family: 'Arial Black', Arial, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
    color: #ffd700;
    text-align: center;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    touch-action: manipulation;
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
  }

  :global(button) {
    -webkit-appearance: none;
    appearance: none;
    touch-action: manipulation;
  }

  :global(button:active) {
    transform: scale(0.97);
  }

  :global(a) {
    touch-action: manipulation;
  }

  /* Improve input focus on mobile */
  :global(input:focus) {
    font-size: 16px;
  }
</style>
