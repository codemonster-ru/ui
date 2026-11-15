import { followShowcaseTheme, saveShowcaseTheme } from './showcase-theme.js';
import { mountCoreMatrices, mountCoreRecipes } from './showcase-core-recipes.js';
import { mountLayoutRecipes } from './showcase-layout-recipes.js';
import { mountLayoutPreviews } from './showcase-layouts.js';
import { createRuntime } from './runtime.js';
import { fillContrastTable, mountOperations } from './showcase-reference.js';
import { copyIcon, filterIcons } from './showcase-icon-catalog.js';

const catalog = document.querySelector('.showcase-catalog');
fillContrastTable(catalog);
for (const button of catalog.querySelectorAll('[data-showcase-copy-color]')) {
  button.disabled = false;
  button.addEventListener('click', async () => {
    const figure = button.closest('figure');
    const code = figure.querySelector('code');
    const status = figure.querySelector('[role="status"]');
    try {
      await navigator.clipboard.writeText(code.textContent);
      status.textContent = 'Copied';
    } catch {
      status.textContent = 'Copy unavailable';
    }
  });
}
mountOperations(catalog);
mountLayoutPreviews(catalog);
mountLayoutRecipes(catalog);
mountCoreRecipes(catalog);
mountCoreMatrices(catalog, createRuntime());

const iconCatalog = document.querySelector('#icon-catalog');
iconCatalog?.addEventListener('input', filterIcons);
iconCatalog?.addEventListener('click', copyIcon);

const themeButton = document.querySelector('#showcase-theme');
const themeModeLabel = document.querySelector('[data-showcase-theme-mode]');
const themeResolvedLabel = document.querySelector('[data-showcase-theme-resolved]');
const themeButtons = document.querySelectorAll('[data-showcase-set-theme]');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const themeDefault = 'system';
let themeMode = themeDefault;
const isDark = (mode) => mode === 'dark' || (mode === 'system' && systemTheme.matches);
const syncThemeControls = (mode) => {
  themeMode = mode;
  for (const input of document.querySelectorAll('#showcase-theme-example input')) {
    input.checked = input.value === mode;
  }
  for (const icon of themeButton.querySelectorAll('[data-showcase-theme-icon]')) {
    icon.hidden = icon.dataset.showcaseThemeIcon !== (isDark(mode) ? 'moon' : 'sun');
  }
  themeButton.hidden = false;
  if (themeModeLabel) themeModeLabel.textContent = `mode: ${mode}`;
  if (themeResolvedLabel) themeResolvedLabel.textContent = `resolved: ${isDark(mode) ? 'dark' : 'light'}`;
  for (const button of themeButtons) {
    if (button.dataset.showcaseSetTheme !== 'toggle') {
      button.setAttribute('aria-pressed', String(button.dataset.showcaseSetTheme === mode));
    }
    button.disabled = false;
  }
};
followShowcaseTheme(syncThemeControls, themeDefault);
systemTheme.addEventListener('change', () => syncThemeControls(themeMode));
function selectTheme(mode) {
  const next = mode === 'toggle' ? (isDark(themeMode) ? 'light' : 'dark') : mode;
  saveShowcaseTheme(next);
  syncThemeControls(next);
}
themeButton.addEventListener('click', () => selectTheme('toggle'));
for (const button of themeButtons) {
  button.addEventListener('click', () => selectTheme(button.dataset.showcaseSetTheme));
}

catalog.addEventListener('cm:theme-change', (event) => {
  selectTheme(event.detail.mode);
});

const search = document.querySelector('#showcase-search');
const cards = [...document.querySelectorAll('.showcase-card')];
const empty = document.querySelector('#showcase-empty');
search?.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase();
  for (const card of cards) card.hidden = !card.textContent.toLowerCase().includes(query);
  for (const group of document.querySelectorAll('.showcase-group')) {
    group.hidden = Boolean(query) && !group.querySelector('.showcase-card:not([hidden])');
  }
  empty.hidden = cards.some((card) => !card.hidden);
});
