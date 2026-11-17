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

/** @param {HTMLElement} root */
export function mountWarehousePagination(root) {
  const table = root.querySelector('#showcase-warehouse');
  if (!table) return;
  const rows = [...table.querySelectorAll('[data-cm-data-table-row]')];

  function update() {
    const page = Number(table.dataset.cmDataTablePage);
    const size = Number(table.dataset.cmDataTablePageSize);
    const start = (page - 1) * size;
    rows.forEach((row, index) => {
      row.hidden = index < start || index >= start + size;
    });
  }

  table.addEventListener('cm:data-table-page-change', update);
  table.addEventListener('cm:data-table-page-size-change', update);
}
