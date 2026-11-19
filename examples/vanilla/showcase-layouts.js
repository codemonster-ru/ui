export function mountLayoutPreviews(catalog) {
  for (const section of catalog.querySelectorAll('[data-layout-preview]')) {
    const viewport = section.querySelector('.layout-preview__viewport');
    const frame = section.querySelector('.layout-preview__frame');
    const choices = [...section.querySelectorAll('[data-preview-width]')];
    const defaultWidth = frame.width;
    let preferred;

    function resize() {
      const choice =
        preferred ??
        choices.findLast((input) => {
          const width = Number(input.dataset.previewWidth);
          return width <= viewport.clientWidth && width <= Number(defaultWidth);
        }) ??
        choices[0];
      choice.checked = true;
      frame.width = choice.dataset.previewWidth;
    }

    section.addEventListener('change', ({ target }) => {
      if (!choices.includes(target)) return;
      preferred = target;
      resize();
    });
    new ResizeObserver(resize).observe(viewport);
    resize();
  }
}
