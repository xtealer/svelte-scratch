<script lang="ts">
</script>

<div class="menu">
  <h1>JUEGOS DE ORO</h1>
  <p class="subtitle">Elige Tu Juego</p>

  <div class="games">
    <a href="/scratch" class="game-card">
      <div class="game-icon">🎫</div>
      <div class="game-title">RASCA Y GANA</div>
      <div class="game-desc">¡Rasca y Gana!</div>
      <div class="game-prize">Gana hasta $500</div>
    </a>

    <a href="/slots" class="game-card">
      <div class="game-icon">🎰</div>
      <div class="game-title">TRAGAMONEDAS</div>
      <div class="game-desc">¡Gira y Gana!</div>
      <div class="game-prize">Gana hasta $500</div>
    </a>
  </div>
</div>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 16px;
    width: 100%;
  }

  h1 {
    font-size: 2.2em;
    color: #ffd700;
    text-shadow:
      0 0 20px #ff0,
      3px 3px 10px #000;
    margin: 0 0 8px 0;
    text-align: center;
  }

  .subtitle {
    font-size: 1.1em;
    color: #aaa;
    margin: 0 0 24px 0;
  }

  .games {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    max-width: 600px;
  }

  .game-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, #222, #333);
    border: 3px solid #ffd700;
    border-radius: 16px;
    text-decoration: none;
    color: inherit;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.8),
      inset 0 0 20px rgba(255, 215, 0, 0.1);
    flex: 1;
    min-width: 140px;
    max-width: 180px;
  }

  .game-card:active {
    transform: scale(0.97);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.9),
      inset 0 0 30px rgba(255, 215, 0, 0.2);
  }

  .game-icon {
    font-size: 3em;
    margin-bottom: 10px;
  }

  .game-title {
    font-size: 1.1em;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 2px 2px 5px #000;
    margin-bottom: 6px;
    text-align: center;
  }

  .game-desc {
    font-size: 0.9em;
    color: #ccc;
    margin-bottom: 10px;
  }

  .game-prize {
    font-size: 0.85em;
    color: #00ff00;
    background: rgba(0, 255, 0, 0.1);
    padding: 6px 12px;
    border-radius: 16px;
    border: 1px solid #00ff00;
    white-space: nowrap;
  }

  @media (min-width: 400px) {
    h1 {
      font-size: 2.6em;
    }
    .subtitle {
      font-size: 1.2em;
      margin-bottom: 32px;
    }
    .games {
      gap: 24px;
    }
    .game-card {
      padding: 28px 36px;
      min-width: 180px;
      max-width: 220px;
    }
    .game-icon {
      font-size: 3.5em;
      margin-bottom: 14px;
    }
    .game-title {
      font-size: 1.4em;
      margin-bottom: 8px;
    }
    .game-desc {
      font-size: 1em;
      margin-bottom: 14px;
    }
    .game-prize {
      font-size: 0.95em;
      padding: 8px 16px;
    }
  }
</style>
