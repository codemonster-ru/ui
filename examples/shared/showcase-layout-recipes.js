/** @param {HTMLElement} root */
export function mountLayoutRecipes(root) {
  const value = root.querySelector('[data-layout-value]');
  if (!value) return () => {};

  const breakpoint = root.querySelector('[data-layout-breakpoint]');
  const entries = [...root.querySelectorAll('.layout-breakpoints .layout-breakpoint-entry')].map((entry) => [
    entry.querySelector('dt').textContent,
    Number.parseInt(entry.querySelector('dd').textContent, 10),
  ]);
  function resize() {
    const name = entries.findLast(([, minimum]) => innerWidth >= minimum)?.[0];
    breakpoint.textContent = name ?? 'Below xs';
    const layout = ['sm', 'md', 'lg', 'xl'].includes(name) ? name : name === '2xl' ? 'xl' : 'base';
    value.textContent = `${layout} layout`;
  }
  resize();
  window.addEventListener('resize', resize);

  return () => window.removeEventListener('resize', resize);
}

/** @param {Element | null} content */
export function fitLayoutPreview(content) {
  const frame = window.frameElement;
  if (!content || !frame?.matches('iframe.layout-preview__frame')) return;

  const observer = new ResizeObserver(() => {
    const height = Math.ceil(content.getBoundingClientRect().height);
    if (height > 0 && frame.style.blockSize !== `${height}px`) {
      frame.style.blockSize = `${height}px`;
    }
  });
  observer.observe(content, { box: 'border-box' });
}

/** @param {(layout: string, options: string[]) => void} update */
export function followAppShellPreview(update) {
  const frame = window.frameElement;
  const attributeFilter = ['data-app-shell-layout', 'data-app-shell-options'];
  if (!frame?.hasAttribute('data-app-shell-layout')) return;

  const sync = () => {
    const layout = frame.getAttribute('data-app-shell-layout');
    const options = frame.getAttribute('data-app-shell-options');
    if (layout) update(layout, options ? options.split(' ') : []);
  };
  const observer = new MutationObserver(sync);
  const observe = () => {
    sync();
    observer.observe(frame, { attributes: true, attributeFilter });
  };
  observe();
  window.addEventListener('pagehide', () => observer.disconnect());
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) observe();
  });
}

/** @param {HTMLElement} root */
export function mountWarehousePagination(root) {
  const table = root.querySelector('#showcase-warehouse');
  if (!table) return;
  const body = table.querySelector('tbody');
  const rows = [...body.rows];
  const pages = [...table.querySelectorAll('.cm-data-table__pagination-page')];
  const previous = table.querySelector('[data-cm-data-table-page-action="previous"]');
  const next = table.querySelector('[data-cm-data-table-page-action="next"]');
  let focusedArrow;

  function updatePage() {
    const page = Number(table.dataset.cmDataTablePage);
    const pageCount = Number(table.dataset.cmDataTablePageCount);
    const size = Number(table.dataset.cmDataTablePageSize);
    const start = (page - 1) * size;
    const pageRows = rows.slice(start, start + size);
    // The table adds a divider after a preceding row even when that row is hidden.
    for (const row of pageRows) row.hidden = false;
    body.replaceChildren(...pageRows);
    pages.forEach((button, index) => {
      const number = index + 1;
      button.hidden = number > pageCount;
      if (number === page) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
      button.setAttribute('aria-label', number === page ? `Page ${page} of ${pageCount}` : `Go to page ${number}`);
    });
    if (
      focusedArrow?.disabled &&
      (document.activeElement === focusedArrow || document.activeElement === document.body)
    ) {
      pages[page - 1]?.focus();
    }
    focusedArrow = undefined;
  }

  table.addEventListener('cm:data-table-page-change', updatePage);
  table.addEventListener('cm:data-table-page-size-change', updatePage);
  table.addEventListener(
    'click',
    ({ target }) => {
      const arrow = target.closest('[data-cm-data-table-page-action]');
      focusedArrow = arrow === document.activeElement ? arrow : undefined;

      const number = pages.indexOf(target.closest('.cm-data-table__pagination-page')) + 1;
      if (!number) return;
      const page = Number(table.dataset.cmDataTablePage);
      // The warehouse demo has at most two pages. Use the table's adjacent page actions.
      if (number === page + 1) next.click();
      if (number === page - 1) previous.click();
    },
    true,
  );
}
