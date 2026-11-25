import { fitShellPreviewForLayout } from './showcase-layout-recipes.js';

export function mountLayoutPreviews(catalog) {
  for (const section of catalog.querySelectorAll('[data-layout-preview]')) {
    const frame = section.querySelector('.layout-preview__frame');
    section.addEventListener('change', ({ target }) => {
      const width = target.dataset.previewWidth;
      if (width) {
        frame.toggleAttribute('data-fit', width === 'fit');
        if (width === 'fit') frame.removeAttribute('width');
        else frame.width = width;
      } else if (target.hasAttribute('data-region-control')) {
        frame.dataset.shellPreviewOptions = [...section.querySelectorAll('[data-region-control]:checked')]
          .map((input) => input.dataset.regionControl)
          .join(' ');
      }
    });

    if (frame.hasAttribute('data-shell-preview-layout')) {
      const option = (key) => section.querySelector(`[data-region-control="${key}"]`).closest('[data-region-option]');
      const sidebar = option('sidebar');
      const aside = option('aside');
      section.addEventListener('cm:tabs-value-change', ({ detail: { value } }) => {
        frame.dataset.shellPreviewLayout = value;
        sidebar.hidden = value === 'content';
        aside.hidden = value !== 'sidebar-content-aside';
        fitShellPreviewForLayout(frame, value, (width) => {
          section.querySelector(`[data-preview-width="${width}"]`)?.click();
        });
      });
    }
  }
}
