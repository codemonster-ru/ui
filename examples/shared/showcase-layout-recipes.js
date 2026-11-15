/** @param {HTMLElement} root */
export function mountLayoutRecipes(root) {
  const value = root.querySelector('[data-layout-value]');
  if (!value) return () => {};

  const breakpoint = root.querySelector('[data-layout-breakpoint]');
  const entries = [...root.querySelectorAll('.layout-breakpoints .layout-breakpoint-entry')].map((entry) => [
    entry.querySelector('dt').textContent,
    Number.parseInt(entry.querySelector('dd').textContent, 10),
  ]);
  const previews = [...root.querySelectorAll('.layout-guide-entry:has([data-recipe-width])')].map((section) => {
    const frame = section.querySelector('.layout-recipe-frame');
    const choices = [...section.querySelectorAll('[data-recipe-width]')];
    let preferred = choices.find((input) => input.checked);
    const select = (input) => {
      input.checked = true;
      frame.style.maxInlineSize = input.value + 'px';
    };
    for (const input of choices) {
      input.addEventListener('change', () => {
        preferred = input;
        select(input);
      });
    }
    return () => {
      const available = choices.filter((input) => Number(input.value) <= innerWidth);
      if (!available.length) available.push(choices[0]);
      for (const input of choices) input.closest('label').hidden = !available.includes(input);
      select(available.includes(preferred) ? preferred : available.at(-1));
    };
  });
  function resize() {
    const name = entries.findLast(([, minimum]) => innerWidth >= minimum)?.[0];
    breakpoint.textContent = name ?? 'Below xs';
    const layout = ['sm', 'md', 'lg', 'xl'].includes(name) ? name : name === '2xl' ? 'xl' : 'base';
    value.textContent = `${layout} layout`;
    for (const resizePreview of previews) resizePreview();
  }
  resize();
  window.addEventListener('resize', resize);

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
