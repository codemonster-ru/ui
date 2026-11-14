import { followShowcaseTheme, saveShowcaseTheme } from './showcase-theme.js';
import { mountCoreRecipes } from './showcase-core-recipes.js';
import { mountLayoutRecipes } from './showcase-layout-recipes.js';
import { mountLayoutPreviews } from './showcase-layouts.js';
import { createRuntime } from './runtime.js';
import { fillContrastTable, mountOperations } from './showcase-reference.js';
import { copyIcon, filterIcons } from './showcase-icon-catalog.js';

const catalog = document.querySelector('.showcase-catalog');
fillContrastTable(catalog);
mountOperations(catalog);
mountLayoutPreviews(catalog);
mountLayoutRecipes(catalog);
mountCoreRecipes(catalog);
createRuntime().start(catalog);

const iconCatalog = document.querySelector('#icon-catalog');
iconCatalog?.addEventListener('input', filterIcons);
iconCatalog?.addEventListener('click', copyIcon);

const themeControls = document.querySelector('#showcase-theme');
const syncThemeControls = (mode) => {
  themeControls.querySelector(`[value="${mode}"]`).checked = true;
};
followShowcaseTheme(syncThemeControls);
themeControls.addEventListener('change', ({ target }) => {
  saveShowcaseTheme(target.value);
  syncThemeControls(target.value);
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
