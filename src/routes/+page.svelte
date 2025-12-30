<script lang="ts">
</script>

<div class="menu">
  <h1>JUEGOS DE ORO</h1>
  <p class="subtitle">Elige Tu Juego</p>

  <div class="games">
    <a href="/scratch" class="game-card">
      <div class="game-icon">🎫</div>
      <div class="game-title">RASPA Y GANA</div>
      <div class="game-desc">Raspa y Gana!</div>
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
    padding: 20px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  }

  h1 {
    font-size: 3em;
    color: #ffd700;
    text-shadow:
      0 0 20px #ff0,
      3px 3px 10px #000;
    margin: 0 0 10px 0;
    text-align: center;
  }

  .subtitle {
    font-size: 1.3em;
    color: #aaa;
    margin: 0 0 40px 0;
  }

  .games {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 700px;
  }

  .game-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 40px;
    background: linear-gradient(135deg, #222, #333);
    border: 3px solid #ffd700;
    border-radius: 20px;
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.8),
      inset 0 0 20px rgba(255, 215, 0, 0.1);
    min-width: 200px;
  }

  .game-card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow:
      0 15px 40px rgba(0, 0, 0, 0.9),
      inset 0 0 30px rgba(255, 215, 0, 0.2),
      0 0 20px rgba(255, 215, 0, 0.3);
  }

  .game-card:active {
    transform: scale(0.98);
  }

  .game-icon {
    font-size: 4em;
    margin-bottom: 15px;
  }

  .game-title {
    font-size: 1.6em;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 2px 2px 5px #000;
    margin-bottom: 8px;
  }

  .game-desc {
    font-size: 1.1em;
    color: #ccc;
    margin-bottom: 15px;
  }

  .game-prize {
    font-size: 1em;
    color: #00ff00;
    background: rgba(0, 255, 0, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid #00ff00;
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 2.2em;
    }

    .games {
      gap: 20px;
    }

    .game-card {
      padding: 25px 30px;
      min-width: 160px;
    }

    .game-icon {
      font-size: 3em;
    }

    .game-title {
      font-size: 1.3em;
    }
  }
</style>
