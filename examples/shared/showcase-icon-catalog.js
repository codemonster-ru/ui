/** @param {Event} event */
export function filterIcons({ target }) {
  if (!(target instanceof HTMLInputElement) || target.id !== 'icon-catalog-search') return;
  const catalog = target.closest('#icon-catalog');
  const query = target.value.trim().toLowerCase();
  let matches = 0;

  for (const entry of catalog.querySelectorAll('[data-icon-name]')) {
    entry.hidden = !query
      .split(/\s+/u)
      .every((term) => `${entry.dataset.iconName} ${entry.dataset.iconSearch}`.toLowerCase().includes(term));
    if (!entry.hidden) matches += 1;
  }

  catalog.querySelector('[data-icon-empty]').hidden = matches > 0;
}

/** @param {Event} event */
export async function copyIcon({ target }) {
  const button = target instanceof Element ? target.closest('[data-copy-icon]') : null;
  if (!button) return;
  const { iconName } = button.closest('[data-icon-name]').dataset;
  const status = button.closest('#icon-catalog').querySelector('[data-icon-copy-status]');

  try {
    await navigator.clipboard.writeText(iconName);
    status.textContent = `Copied ${iconName}.`;
  } catch {
    status.textContent = `Could not copy ${iconName}.`;
  }
}
