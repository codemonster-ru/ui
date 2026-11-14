/** @param {HTMLElement} root */
export function mountLayoutRecipes(root) {
  const width = root.querySelector('[data-layout-width]');
  if (!width) return () => {};

  const breakpoint = root.querySelector('[data-layout-breakpoint]');
  const entries = [...root.querySelectorAll('.layout-breakpoint-entry')].map((entry) => [
    entry.querySelector('dt').textContent,
    Number.parseInt(entry.querySelector('dd').textContent, 10),
  ]);
  function resize() {
    width.textContent = `${innerWidth} px`;
    const active = entries.findLast(([, minimum]) => innerWidth >= minimum);
    breakpoint.textContent = active?.[0] ?? 'Below xs';
  }
  resize();
  window.addEventListener('resize', resize);

  for (const input of root.querySelectorAll('[data-recipe-width]')) {
    input.addEventListener('change', () => {
      input.closest('section').querySelector('.layout-recipe-frame').style.maxInlineSize = input.value + 'px';
    });
  }

  const form = root.querySelector('[data-layout-auth]');
  const password = form.querySelector('input[autocomplete="current-password"]');
  form.querySelector('[data-layout-reveal]').addEventListener('change', ({ target }) => {
    password.type = target.checked ? 'text' : 'password';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.querySelector('output').textContent = 'Sign-in preview submitted.';
  });

  return () => window.removeEventListener('resize', resize);
}

/** @param {HTMLElement} root */
export function mountWarehousePagination(root) {
  const pagination = root.querySelector('.warehouse-pagination');
  if (!pagination) return;
  const table = root.querySelector('#showcase-warehouse');
  const selector = pagination.querySelector('[data-warehouse-size]');
  const buttons = [...pagination.querySelectorAll('[data-warehouse-page]')];
  const total = Number(pagination.dataset.totalRows);
  let page = 1;

  function update() {
    const size = Number(selector.value);
    const last = Math.ceil(total / size);
    const start = (page - 1) * size;
    pagination.querySelector('[data-warehouse-summary]').textContent =
      `${start + 1}–${Math.min(start + size, total)} of ${total}`;
    for (const button of buttons) {
      const value = button.dataset.warehousePage;
      button.disabled = value === 'previous' ? page === 1 : value === 'next' && page === last;
      button.hidden = Number(value) > last;
      if (Number(value) === page) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    if (table.dataset.warehouseStatic !== undefined) {
      [...table.querySelectorAll('tbody tr')].forEach((row, index) => {
        row.hidden = index < start || index >= start + size;
      });
    }
    pagination.dispatchEvent(new CustomEvent('warehouse-page', { bubbles: true, detail: { page, size } }));
  }

  pagination.addEventListener('click', ({ target }) => {
    const button = target.closest('[data-warehouse-page]');
    if (!button || button.disabled || button.hidden) return;
    const value = button.dataset.warehousePage;
    page = value === 'previous' ? page - 1 : value === 'next' ? page + 1 : Number(value);
    update();
  });
  selector.addEventListener('change', () => {
    page = 1;
    update();
  });
}
