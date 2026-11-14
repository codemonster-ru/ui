import { createRuntime } from './runtime.js';
import { fillContrastTable, mountOperations } from './showcase-reference.js';
import { copyIcon, filterIcons } from './showcase-icon-catalog.js';

const catalog = document.querySelector('.showcase-catalog');
fillContrastTable(catalog);
mountOperations(catalog);
createRuntime().start(catalog);

const iconCatalog = document.querySelector('#icon-catalog');
iconCatalog?.addEventListener('input', filterIcons);
iconCatalog?.addEventListener('click', copyIcon);

const themeButton = document.querySelector('#showcase-theme');
const root = document.documentElement;
const themeKey = 'cm-showcase-theme';

function updateTheme() {
  const theme = localStorage.getItem(themeKey);
  root.dataset.cmTheme = ['light', 'dark', 'system'].includes(theme) ? theme : 'light';
  themeButton.setAttribute(
    'aria-pressed',
    String(
      root.dataset.cmTheme === 'dark' ||
        (root.dataset.cmTheme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches),
    ),
  );
}

updateTheme();
window.addEventListener('storage', (event) => {
  if (event.key === themeKey) updateTheme();
});
themeButton.addEventListener('click', () => {
  const theme = themeButton.getAttribute('aria-pressed') === 'true' ? 'light' : 'dark';
  localStorage.setItem(themeKey, theme);
  updateTheme();
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
