<script lang="ts">
  import { browser } from '$app/environment';
  import { Globe } from 'lucide-svelte';
  import { currentLanguage, setLanguage, getSupportedLanguages, t, type Language } from './i18n';

  let isOpen = $state(false);

  const languages = getSupportedLanguages();

  function selectLanguage(code: Language) {
    setLanguage(code);
    isOpen = false;
    // Force full page refresh to apply language changes
    if (browser) {
      window.location.href = window.location.href;
    }
  }

  function getCurrentLabel(lang: Language): string {
    return languages.find(l => l.code === lang)?.nativeLabel || 'English';
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-selector')) {
      isOpen = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<footer class="app-footer">
  <div class="footer-content">
    <span class="copyright">{$t.footer.copyright}</span>

    <div class="language-selector">
      <button class="lang-btn" onclick={(e) => { e.stopPropagation(); isOpen = !isOpen; }}>
        <Globe size={16} />
        <span>{getCurrentLabel($currentLanguage)}</span>
      </button>

      {#if isOpen}
        <div class="lang-dropdown">
          {#each languages as lang}
            <button
              class="lang-option"
              class:active={$currentLanguage === lang.code}
              onclick={(e) => { e.stopPropagation(); selectLanguage(lang.code); }}
            >
              <span class="native">{lang.nativeLabel}</span>
              <span class="english">{lang.label}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</footer>

<style>
  .app-footer {
    width: 100%;
    margin-top: auto;
    padding: 12px 16px;
    background: rgba(20, 20, 35, 0.95);
    border-top: 1px solid #333;
    flex-shrink: 0;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 8px;
  }

  .copyright {
    color: #666;
    font-size: 0.8em;
  }

  .language-selector {
    position: relative;
  }

  .lang-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
    border-radius: 6px;
    color: #ccc;
    cursor: pointer;
    font-size: 0.85em;
    transition: all 0.2s;
  }

  .lang-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  .lang-dropdown {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 4px;
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    overflow: hidden;
    z-index: 1000;
    min-width: 150px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4);
  }

  .lang-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    color: #ccc;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }

  .lang-option:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .lang-option.active {
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
  }

  .native {
    font-weight: bold;
    font-size: 0.95em;
  }

  .english {
    font-size: 0.75em;
    color: #888;
  }

  .lang-option.active .english {
    color: #b8860b;
  }

  @media (max-width: 480px) {
    .app-footer {
      padding: 10px 12px;
    }

    .footer-content {
      padding: 0 4px;
    }

    .copyright {
      font-size: 0.75em;
    }

    .lang-btn {
      padding: 6px 10px;
      font-size: 0.8em;
    }
  }
</style>
