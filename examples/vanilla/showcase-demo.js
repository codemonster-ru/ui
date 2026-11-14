import { createRuntime } from './runtime.js';

const themeKey = 'cm-showcase-theme';
const root = document.documentElement;
const applyTheme = () => {
  const theme = localStorage.getItem(themeKey);
  root.dataset.cmTheme = ['light', 'dark', 'system'].includes(theme) ? theme : 'light';
};

applyTheme();
window.addEventListener('storage', (event) => {
  if (event.key === themeKey) applyTheme();
});

const demo = document.querySelector('.showcase-demo');
// An initially open fixture must not steal focus from the surrounding catalog.
createRuntime().start(demo);
demo.inert = false;
demo.addEventListener('submit', (event) => event.preventDefault());
demo.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="/"]');
  if (link && link.origin === window.parent.location.origin) event.preventDefault();
});
demo.addEventListener('cm:theme-change', () => localStorage.setItem(themeKey, root.dataset.cmTheme));

const modal = demo.querySelector('dialog[data-cm-controller]');
if (modal) {
  document.querySelector('#showcase-open').addEventListener('click', () => {
    modal.dispatchEvent(new CustomEvent(`cm:${modal.dataset.cmController}-open-request`));
  });
}

const frame = window.frameElement;
if (frame && !frame.classList.contains('showcase-frame--tall')) {
  new ResizeObserver(() => {
    frame.style.blockSize = `${Math.ceil(demo.getBoundingClientRect().height)}px`;
  }).observe(demo);
}
