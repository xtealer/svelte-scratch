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
  }

  :global(body) {
    margin: 0;
    padding: 10px;
    font-family: 'Arial Black', Arial, sans-serif;
    background: linear-gradient(#0f0f0f, #1a0a00);
    color: #ffd700;
    text-align: center;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    touch-action: manipulation;
  }
</style>
