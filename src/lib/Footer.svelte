<script lang="ts">
  import { Globe } from 'lucide-svelte';
  import { currentLanguage, setLanguage, getSupportedLanguages, t, type Language } from './i18n';

  let isOpen = $state(false);

  const languages = getSupportedLanguages();

  function selectLanguage(code: Language) {
    setLanguage(code);
    isOpen = false;
  }

  function getCurrentLabel(langCode: Language): string {
    return languages.find(l => l.code === langCode)?.nativeLabel || 'English';
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
          {#each languages as language}
            <button
              class="lang-option"
              class:active={$currentLanguage === language.code}
              onclick={(e) => { e.stopPropagation(); selectLanguage(language.code); }}
            >
              <span class="native">{language.nativeLabel}</span>
              <span class="english">{language.label}</span>
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
    padding: 16px;
    background: #1a2c38;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .copyright {
    color: #7f8c8d;
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #b1bad3;
    cursor: pointer;
    font-size: 0.85em;
    transition: all 0.2s;
  }

  .lang-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .lang-dropdown {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 4px;
    background: #213743;
    border: 1px solid rgba(255, 255, 255, 0.1);
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
    color: #b1bad3;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }

  .lang-option:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .lang-option.active {
    background: rgba(0, 231, 1, 0.1);
    color: #00e701;
  }

  .native {
    font-weight: bold;
    font-size: 0.95em;
  }

  .english {
    font-size: 0.75em;
    color: #7f8c8d;
  }

  .lang-option.active .english {
    color: #00c700;
  }

  @media (max-width: 480px) {
    .app-footer {
      padding: 12px;
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
