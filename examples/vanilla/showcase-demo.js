import { followShowcaseFrameTheme, saveShowcaseTheme } from './showcase-theme.js';
import { createRuntime } from './runtime.js';

const demo = document.querySelector('.showcase-demo');
followShowcaseFrameTheme((mode) => {
  for (const input of demo.querySelectorAll('[data-cm-controller="theme-switch"] input[type="radio"]')) {
    input.checked = input.value === mode;
  }
});
// An initially open fixture must not steal focus from the surrounding catalog.
createRuntime().start(demo);
demo.inert = false;
demo.addEventListener('submit', (event) => event.preventDefault());
demo.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="/"]');
  if (link && link.origin === window.parent.location.origin) event.preventDefault();
});
demo.addEventListener('cm:theme-change', (event) => saveShowcaseTheme(event.detail.mode));

if (demo.hasAttribute('data-showcase-sort-rows')) {
  const body = demo.querySelector('tbody');
  const rows = [...body.rows];
  demo.addEventListener('cm:data-table-sort-change', ({ detail: { sort } }) => {
    // The Name column is the first and only sortable column in this demo.
    const ordered = sort
      ? [...rows].sort((left, right) => {
          const comparison = left.cells[0].textContent.localeCompare(right.cells[0].textContent);
          return sort.direction === 'descending' ? -comparison : comparison;
        })
      : rows;
    body.append(...ordered);
  });
}

const modal = demo.querySelector('dialog[data-cm-controller]');
if (modal) {
  document.querySelector('#showcase-open').addEventListener('click', () => {
    modal.dispatchEvent(new CustomEvent(`cm:${modal.dataset.cmController}-open-request`));
  });
}

const frame = window.frameElement;
if (frame && !frame.matches('.showcase-frame--tall, .reference-frame--tall')) {
  new ResizeObserver(() => {
    frame.style.blockSize = `${Math.ceil(demo.getBoundingClientRect().height)}px`;
  }).observe(demo);
}
