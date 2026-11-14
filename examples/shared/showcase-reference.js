/** @param {HTMLElement} root */
export function fillContrastTable(root) {
  const cells = root.querySelectorAll('[data-contrast-foreground]');
  if (!cells.length) return;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  const luminance = (color) => {
    if (!CSS.supports('color', color)) return NaN;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const channels = [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((byte) => {
      const channel = byte / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };

  for (const cell of cells) {
    const style = getComputedStyle(cell);
    const foreground = luminance(style.getPropertyValue(cell.dataset.contrastForeground));
    const background = luminance(style.getPropertyValue(cell.dataset.contrastBackground));
    const ratio = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    cell.textContent = Number.isFinite(ratio) ? `${ratio.toFixed(2)}:1` : 'Unavailable';
  }
}

/** @param {HTMLElement} root */
export function mountOperations(root) {
  for (const dashboard of root.querySelectorAll('[data-operation]')) {
    const filter = dashboard.querySelector('[data-operation-filter]');
    const search = dashboard.querySelector('[data-operation-search]');
    const rows = [...dashboard.querySelectorAll('[data-operation-row]')];
    const previous = dashboard.querySelector('[data-operation-page="previous"]');
    const next = dashboard.querySelector('[data-operation-page="next"]');
    const count = dashboard.querySelector('[data-operation-count]');
    let page = 0;

    const update = () => {
      const query = search.value.trim().toLowerCase();
      const matching = rows.filter(
        (row) => row.dataset.operationRow === filter.value && row.cells[0].textContent.toLowerCase().includes(query),
      );
      rows.forEach((row) => {
        row.hidden = true;
      });
      matching.slice(page * 2, page * 2 + 2).forEach((row) => {
        row.hidden = false;
      });
      previous.disabled = page === 0;
      next.disabled = (page + 1) * 2 >= matching.length;
      count.textContent = matching.length
        ? `${page * 2 + 1}–${Math.min((page + 1) * 2, matching.length)} of ${matching.length}`
        : 'No projects found';
    };
    const reset = () => {
      page = 0;
      update();
    };
    filter.addEventListener('change', reset);
    search.addEventListener('input', reset);
    previous.addEventListener('click', () => {
      page -= 1;
      update();
    });
    next.addEventListener('click', () => {
      page += 1;
      update();
    });

    dashboard.addEventListener('click', ({ target }) => {
      if (!(target instanceof Element)) return;
      const navigation = target.closest('[data-operation-nav]');
      if (navigation) {
        dashboard.querySelector('[data-operation-nav][aria-current]')?.removeAttribute('aria-current');
        navigation.setAttribute('aria-current', 'page');
        const label = navigation.textContent.trim();
        dashboard.querySelector('[data-operation-heading]').textContent =
          label === 'Overview' ? 'Operations overview' : label;
      }
      const command = target.closest('[data-operation-action]');
      if (command)
        dashboard.querySelector('[data-operation-status]').textContent = `${command.dataset.operationAction} selected.`;
    });
  }
}
