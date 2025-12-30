<script lang="ts">
  import { Globe } from 'lucide-svelte';
  import { getLanguage, setLanguage, getSupportedLanguages, type Language } from './i18n';

  let currentLang = $state(getLanguage());
  let isOpen = $state(false);

  const languages = getSupportedLanguages();

  function selectLanguage(code: Language) {
    setLanguage(code);
    currentLang = code;
    isOpen = false;
    // Reload page to apply language changes
    window.location.reload();
  }

  function getCurrentLabel(): string {
    return languages.find(l => l.code === currentLang)?.nativeLabel || 'English';
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
    <span class="copyright">Casino Admin Panel</span>

    <div class="language-selector">
      <button class="lang-btn" onclick={(e) => { e.stopPropagation(); isOpen = !isOpen; }}>
        <Globe size={16} />
        <span>{getCurrentLabel()}</span>
      </button>

      {#if isOpen}
        <div class="lang-dropdown">
          {#each languages as lang}
            <button
              class="lang-option"
              class:active={currentLang === lang.code}
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
    margin-top: auto;
    padding: 16px 20px;
    background: rgba(20, 20, 35, 0.9);
    border-top: 1px solid #333;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 100%;
  }

  .copyright {
    color: #666;
    font-size: 0.85em;
  }

  .language-selector {
    position: relative;
  }

  .lang-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
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
    z-index: 100;
    min-width: 150px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
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

  @media (max-width: 768px) {
    .footer-content {
      flex-direction: column;
      gap: 12px;
    }
  }
</style>
