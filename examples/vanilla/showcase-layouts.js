export function mountLayoutPreviews(catalog) {
  for (const section of catalog.querySelectorAll('[data-layout-preview]')) {
    const frame = section.querySelector('.layout-preview__frame');
    section.addEventListener('change', ({ target }) => {
      const width = target.dataset.previewWidth;
      if (!width) return;
      frame.toggleAttribute('data-fit', width === 'fit');
      if (width === 'fit') frame.removeAttribute('width');
      else frame.width = width;
    });
  }
}
