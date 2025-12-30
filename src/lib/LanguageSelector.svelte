<script lang="ts">
  import { Globe } from 'lucide-svelte';
  import { currentLanguage, setLanguage, getSupportedLanguages, type Language } from './i18n';

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

<div class="language-selector">
  <button class="lang-btn" onclick={(e) => { e.stopPropagation(); isOpen = !isOpen; }}>
    <Globe size={18} />
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

<style>
  .language-selector {
    position: relative;
  }

  .lang-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
    border-radius: 8px;
    color: #ccc;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s;
  }

  .lang-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  .lang-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    overflow: hidden;
    z-index: 100;
    min-width: 150px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
    font-size: 0.8em;
    color: #888;
  }

  .lang-option.active .english {
    color: #b8860b;
  }
</style>
