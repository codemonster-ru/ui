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

/** @param {readonly (string | number)[]} cells @param {string} query */
export function matchesWarehouseFilter(cells, query) {
  const needle = query.trim().toLowerCase();
  return !needle || cells.some((cell) => String(cell).toLowerCase().includes(needle));
}

/** @param {HTMLElement} root @param {import('@codemonster-ru/ui-runtime').CmRuntime} runtime */
export function mountWarehousePagination(root, runtime) {
  const table = root.querySelector('#showcase-warehouse');
  if (!table) return;
  const filter = root.querySelector('#warehouse-filter');
  const empty = table.querySelector('[data-warehouse-empty]');
  const rows = [...table.querySelectorAll('[data-cm-data-table-row]')];
  let matching = rows;

  function update() {
    const page = Number(table.dataset.cmDataTablePage);
    const size = Number(table.dataset.cmDataTablePageSize);
    const start = (page - 1) * size;
    const visible = new Set(matching.slice(start, start + size));
    for (const row of rows) row.hidden = !visible.has(row);
    empty.hidden = matching.length !== 0;
  }

  filter.addEventListener('input', () => {
    matching = rows.filter((row) =>
      matchesWarehouseFilter(
        Array.from(row.cells, (cell) => cell.textContent.trim()),
        filter.value,
      ),
    );
    // Refresh the table's page count and live pagination summaries from the new data.
    runtime.stop(table);
    table.dataset.cmDataTablePage = '1';
    table.dataset.cmDataTableTotalRows = String(matching.length);
    runtime.start(table);
    update();
  });
  table.addEventListener('cm:data-table-page-change', update);
  table.addEventListener('cm:data-table-page-size-change', update);
  filter.closest('[data-warehouse-search]').hidden = false;
}
