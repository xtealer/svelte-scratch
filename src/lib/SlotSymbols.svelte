<script lang="ts">
  interface Props {
    symbol: string;
    size?: number;
  }

  let { symbol, size = 60 }: Props = $props();
</script>

{#if symbol === "cherry"}
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <!-- Stems -->
    <path d="M50 15 Q55 25 52 40" stroke="#8B4513" stroke-width="3" fill="none"/>
    <path d="M50 15 Q45 25 35 35" stroke="#8B4513" stroke-width="3" fill="none"/>
    <!-- Leaf -->
    <ellipse cx="55" cy="12" rx="12" ry="6" fill="#228B22" transform="rotate(-30 55 12)"/>
    <!-- Left cherry -->
    <circle cx="32" cy="55" r="22" fill="#DC143C"/>
    <ellipse cx="26" cy="48" rx="6" ry="4" fill="rgba(255,255,255,0.3)" transform="rotate(-30 26 48)"/>
    <!-- Right cherry -->
    <circle cx="58" cy="60" r="22" fill="#DC143C"/>
    <ellipse cx="52" cy="53" rx="6" ry="4" fill="rgba(255,255,255,0.3)" transform="rotate(-30 52 53)"/>
  </svg>
{:else if symbol === "plum"}
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <!-- Main plum body -->
    <ellipse cx="50" cy="55" rx="32" ry="35" fill="#4169E1"/>
    <!-- Highlight -->
    <ellipse cx="38" cy="42" rx="12" ry="8" fill="rgba(135,206,250,0.5)" transform="rotate(-20 38 42)"/>
    <!-- Stem -->
    <path d="M50 20 Q52 15 55 12" stroke="#8B4513" stroke-width="3" fill="none"/>
    <!-- Texture dots -->
    <circle cx="35" cy="50" r="2" fill="rgba(65,105,225,0.8)"/>
    <circle cx="55" cy="45" r="2" fill="rgba(65,105,225,0.8)"/>
    <circle cx="45" cy="65" r="2" fill="rgba(65,105,225,0.8)"/>
    <circle cx="60" cy="60" r="2" fill="rgba(65,105,225,0.8)"/>
  </svg>
{:else if symbol === "lemon"}
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <!-- Main lemon body -->
    <ellipse cx="50" cy="50" rx="35" ry="28" fill="#DAA520"/>
    <!-- Inner circle (cut view) -->
    <ellipse cx="50" cy="50" rx="28" ry="22" fill="#F4D03F"/>
    <!-- Segments -->
    <path d="M50 30 L50 70" stroke="#DAA520" stroke-width="1" opacity="0.6"/>
    <path d="M30 50 L70 50" stroke="#DAA520" stroke-width="1" opacity="0.6"/>
    <path d="M35 35 L65 65" stroke="#DAA520" stroke-width="1" opacity="0.6"/>
    <path d="M65 35 L35 65" stroke="#DAA520" stroke-width="1" opacity="0.6"/>
    <!-- Center -->
    <circle cx="50" cy="50" r="6" fill="#DAA520"/>
    <!-- Texture dots -->
    <circle cx="40" cy="40" r="3" fill="rgba(218,165,32,0.6)"/>
    <circle cx="60" cy="40" r="3" fill="rgba(218,165,32,0.6)"/>
    <circle cx="40" cy="60" r="3" fill="rgba(218,165,32,0.6)"/>
    <circle cx="60" cy="60" r="3" fill="rgba(218,165,32,0.6)"/>
  </svg>
{:else if symbol === "bell"}
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <!-- Bell body -->
    <path d="M50 15 Q30 20 25 50 Q20 75 20 80 L80 80 Q80 75 75 50 Q70 20 50 15" fill="#FFD700"/>
    <!-- Bell rim -->
    <ellipse cx="50" cy="82" rx="32" ry="6" fill="#B8860B"/>
    <!-- Highlight -->
    <path d="M35 30 Q40 35 38 55" stroke="rgba(255,255,255,0.4)" stroke-width="4" fill="none"/>
    <!-- Top knob -->
    <circle cx="50" cy="12" r="6" fill="#B8860B"/>
    <!-- Clapper -->
    <ellipse cx="50" cy="88" rx="5" ry="4" fill="#8B4513"/>
    <!-- Decorative lines -->
    <path d="M30 65 Q50 70 70 65" stroke="#B8860B" stroke-width="2" fill="none"/>
    <path d="M28 55 Q50 58 72 55" stroke="#B8860B" stroke-width="1.5" fill="none"/>
  </svg>
{:else if symbol === "seven"}
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <!-- Seven outline/shadow -->
    <text x="50" y="78" text-anchor="middle" font-size="72" font-weight="bold" font-family="Arial Black, sans-serif" fill="#8B0000" stroke="#8B0000" stroke-width="4">7</text>
    <!-- Seven main -->
    <text x="50" y="78" text-anchor="middle" font-size="72" font-weight="bold" font-family="Arial Black, sans-serif" fill="#FF0000">7</text>
    <!-- Highlight -->
    <text x="48" y="76" text-anchor="middle" font-size="72" font-weight="bold" font-family="Arial Black, sans-serif" fill="rgba(255,255,255,0.3)" clip-path="url(#clip7)">7</text>
  </svg>
{:else if symbol === "bar"}
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <!-- Bar background -->
    <rect x="10" y="35" width="80" height="30" rx="5" fill="#1a1a1a"/>
    <!-- Bar text -->
    <text x="50" y="58" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial Black, sans-serif" fill="#FFD700">BAR</text>
    <!-- Shine -->
    <rect x="10" y="35" width="80" height="8" rx="5" fill="rgba(255,255,255,0.2)"/>
  </svg>
{:else if symbol === "diamond"}
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <!-- Diamond shape -->
    <polygon points="50,10 85,50 50,90 15,50" fill="#00CED1"/>
    <!-- Facets -->
    <polygon points="50,10 65,35 50,50 35,35" fill="#E0FFFF"/>
    <polygon points="65,35 85,50 50,50" fill="#48D1CC"/>
    <polygon points="35,35 50,50 15,50" fill="#48D1CC"/>
    <polygon points="50,50 85,50 50,90" fill="#008B8B"/>
    <polygon points="50,50 15,50 50,90" fill="#20B2AA"/>
    <!-- Sparkle -->
    <circle cx="40" cy="30" r="3" fill="white" opacity="0.8"/>
  </svg>
{:else if symbol === "star"}
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <!-- Star -->
    <polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" fill="#FFD700"/>
    <!-- Inner highlight -->
    <polygon points="50,20 56,40 75,40 60,52 66,70 50,58 34,70 40,52 25,40 44,40" fill="#FFF8DC"/>
  </svg>
{:else}
  <!-- Fallback question mark -->
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <circle cx="50" cy="50" r="40" fill="#444"/>
    <text x="50" y="65" text-anchor="middle" font-size="50" font-weight="bold" fill="#888">?</text>
  </svg>
{/if}
