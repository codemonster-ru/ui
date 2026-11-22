/** @param {number} count @param {number} total */
export function iconCountLabel(count, total) {
  return count === total ? `${total} icons` : `${count} of ${total} icons`;
}

/** @param {Event} event */
export function filterIcons({ target }) {
  if (!(target instanceof HTMLInputElement) || target.id !== 'icon-catalog-search') return;
  const catalog = target.closest('#icon-catalog');
  const query = target.value.trim().toLowerCase().split(/\s+/u);
  let matches = 0;

  for (const group of catalog.querySelectorAll('[data-icon-group]')) {
    let matched = false;
    for (const entry of group.querySelectorAll('[data-icon-name]')) {
      const terms = entry.dataset.iconSearch.toLowerCase();
      entry.hidden = !query.every((term) => terms.includes(term));
      if (!entry.hidden) {
        matches++;
        matched = true;
      }
    }
    group.querySelector('[data-icon-empty]').hidden = matched;
  }

  const count = catalog.querySelector('[data-icon-count]');
  count.textContent = iconCountLabel(matches, Number(count.dataset.total));
}

/** @param {Event} event */
export async function copyIcon({ target }) {
  const button = target instanceof Element ? target.closest('[data-copy-icon]') : null;
  if (!button) return;
  const { iconName } = button.dataset;
  const status = button.closest('#icon-catalog').querySelector('[data-icon-copy-status]');

  try {
    await navigator.clipboard.writeText(iconName);
    status.textContent = ` · Copied ${iconName}`;
  } catch {
    status.textContent = ' · Copy failed';
  }
}
