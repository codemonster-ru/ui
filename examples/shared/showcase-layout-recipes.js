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
export async function revealLayoutPreview(content) {
  const frame = window.frameElement;
  if (!frame?.matches('iframe.layout-preview__frame')) return;

  // Trigger layout so fonts used by the preview are included in the first measurement.
  document.body.getBoundingClientRect();
  await document.fonts.ready;

  if (content) {
    function fit() {
      const height = Math.ceil(content.getBoundingClientRect().height);
      if (height > 0 && frame.style.blockSize !== `${height}px`) {
        frame.style.blockSize = `${height}px`;
      }
    }

    fit();
    new ResizeObserver(fit).observe(content, { box: 'border-box' });
  }
  frame.setAttribute('data-preview-ready', '');
}

/** @param {HTMLFormElement | null} form */
export function enableAuthPreview(form) {
  const layout = form?.closest('.cm-auth-layout');
  if (!form || !layout) return;

  function enable() {
    form.inert = false;
    observer.disconnect();
    layout.removeEventListener('focusin', enable);
  }

  // A lazy iframe can load below the fold. Expose the fields once the form is in view
  // or keyboard navigation enters the preview through its sign-up link.
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) enable();
  });
  layout.addEventListener('focusin', enable);
  observer.observe(form);
}

const revealAsideAttribute = 'data-shell-preview-reveal-aside';

/** @param {HTMLIFrameElement} frame
 * @param {string} layout
 * @param {(width: string) => void} selectWidth
 */
export function fitShellPreviewForLayout(frame, layout, selectWidth) {
  const viewport = frame.parentElement;
  if (!viewport) return;

  if (layout !== 'sidebar-content-aside') {
    viewport.scrollLeft = 0;
    return;
  }
  if (!frame.hasAttribute('data-fit')) return;

  const styles = getComputedStyle(frame);
  const xl = Number.parseInt(styles.getPropertyValue('--cm-breakpoint-xl'), 10);
  if (!Number.isFinite(xl) || frame.clientWidth >= xl) return;

  selectWidth(String(xl));
  const lg = Number.parseInt(styles.getPropertyValue('--cm-breakpoint-lg'), 10);
  if (viewport.clientWidth < lg) frame.setAttribute(revealAsideAttribute, String(xl));
}

/** @param {'app-shell' | 'document-layout'} slug
 * @param {(layout: string, options: string[]) => void} update
 */
export function followShellPreview(slug, update) {
  const frame = window.frameElement;
  const attributeFilter = ['data-shell-preview-layout', 'data-shell-preview-options'];
  if (!frame?.hasAttribute('data-shell-preview-layout')) return;

  const revealAside = () => {
    const width = frame.getAttribute(revealAsideAttribute);
    if (!width) return;
    frame.removeAttribute(revealAsideAttribute);
    if (
      frame.getAttribute('data-shell-preview-layout') !== 'sidebar-content-aside' ||
      frame.getAttribute('width') !== width
    )
      return;

    const viewport = frame.parentElement;
    const aside = document.querySelector(`.cm-${slug}__aside`);
    if (!viewport || !aside?.getClientRects().length) return;
    const asideStart = frame.getBoundingClientRect().left + aside.getBoundingClientRect().left;
    const viewportStart = viewport.getBoundingClientRect().left + viewport.clientLeft;
    viewport.scrollBy({ left: asideStart - viewportStart, behavior: 'instant' });
  };

  const sync = () => {
    const layout = frame.getAttribute('data-shell-preview-layout');
    const options = frame.getAttribute('data-shell-preview-options');
    if (layout) update(layout, options ? options.split(' ') : []);
    // Align from the parent even when the preview itself is below the visible page.
    if (frame.hasAttribute(revealAsideAttribute)) {
      frame.ownerDocument.defaultView?.requestAnimationFrame(revealAside);
    }
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
