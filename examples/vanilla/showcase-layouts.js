import { mountWarehousePagination } from './showcase-layout-recipes.js';

export function mountLayoutPreviews(catalog) {
  for (const section of catalog.querySelectorAll('[data-layout-preview]')) {
    const preview = section.querySelector('.layout-preview');
    const slug = section.dataset.layoutPreview;
    const shell = preview.querySelector('[data-preview-shell]');
    mountWarehousePagination(section);
    const setup = preview.querySelector('.cm-setup-layout');
    const setupPanels = [...preview.querySelectorAll('[data-preview-step]')];

    function selectNavigation(item) {
      for (const button of item.closest('nav').querySelectorAll('[data-cm-nav-menu-value]')) {
        const selected = item === button;
        if (selected) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
        button.classList.toggle('cm-nav-menu__item--active', selected);
        button.closest('li').classList.toggle('cm-nav-menu__node--active', selected);
      }
    }

    let step = 1;
    function advanceSetup() {
      if (step === setupPanels.length - 1) setup.querySelector('[data-setup-complete]').hidden = false;
      else setStep(step + 1);
    }
    function setStep(next) {
      step = Math.max(0, Math.min(next, setupPanels.length - 1));
      const progress = setup.querySelector('.setup-preview-progress');
      progress.querySelector('span').textContent = `Step ${step + 1} of ${setupPanels.length}`;
      progress.querySelector('progress').value = step + 1;
      const active = setupPanels[step];
      for (const panel of setupPanels) panel.hidden = panel !== active;
      const item = setup.querySelector(`[data-cm-nav-menu-value="${active.dataset.previewStep}"]`);
      selectNavigation(item);
      setup.querySelector('.cm-setup-layout__title').textContent = item.textContent.trim();
      setup.querySelector('[data-preview-back]').disabled = step === 0;
      setup.querySelector('[data-preview-next] .cm-button__label').textContent =
        step === setupPanels.length - 1 ? 'Finish' : 'Continue';
      if (step !== setupPanels.length - 1) setup.querySelector('[data-setup-complete]').hidden = true;
      if (active.dataset.previewStep === 'finish') {
        const field = (name) => setup.querySelector(`[data-preview-field="${name}"]`).value;
        active.textContent = `${field('name')} on ${field('host')}:${field('port')}`;
      }
    }

    section.addEventListener('change', ({ target }) => {
      if (target.name === slug + '-preview') {
        const width = Number(target.dataset.previewWidth);
        preview.style.maxInlineSize = width + 'px';
        section.querySelector('.layout-preview__caption').textContent = `${target.value} · ${width} px`;
        preview.classList.toggle('layout-preview--stacked', width < 1024);
        preview.classList.toggle('layout-preview--two-columns', width >= 1024 && width < 1280);
        const aside = setup?.querySelector('.cm-setup-layout__aside');
        if (aside) {
          aside.hidden = width < 768;
          setup.querySelector('.setup-preview-progress').hidden = width >= 768;
        }
      }
      const region = target.dataset.regionControl;
      if (!region) return;
      preview.querySelector('.layout-preview__frame').classList.toggle('layout-region--' + region, target.checked);
      if (region === 'subheader') shell.querySelector('[data-cm-sticky-subheader]').hidden = !target.checked;
      if (region === 'content-subheader') shell.querySelector('.layout-content-subheader').hidden = !target.checked;
      if (region === 'header' && slug === 'app-shell')
        shell.classList.toggle('cm-app-shell--header-sticky', target.checked);
    });
    section.addEventListener('click', ({ target }) => {
      const item = target.closest('.layout-preview [data-cm-nav-menu-value]');
      if (item) {
        if (setup) setStep(setupPanels.findIndex((panel) => panel.dataset.previewStep === item.dataset.cmNavMenuValue));
        else selectNavigation(item);
      }
      if (target.closest('[data-preview-next]')) advanceSetup();
      if (target.closest('[data-preview-back]')) setStep(step - 1);
    });
    section.addEventListener('cm:setup-layout-next', advanceSetup);
    section.addEventListener('cm:setup-layout-back', () => setStep(step - 1));
    section.addEventListener('cm:tabs-value-change', ({ detail: { value } }) => {
      const prefix = 'cm-' + slug;
      shell.className = `${prefix} ${prefix}--${value}`;
      if (slug === 'app-shell' && preview.querySelector('[data-region-control=header]')?.checked)
        shell.classList.add('cm-app-shell--header-sticky');
      shell.querySelector('.' + prefix + '__sidebar').hidden = value === 'content';
      shell.querySelector('.' + prefix + '__aside').hidden = value !== 'sidebar-content-aside';
    });

    const fieldset = section.querySelector('.layout-preview__sizes');
    const widths = [...fieldset.querySelectorAll('input')];
    let preferredWidth = widths.find((input) => input.checked);
    function resize() {
      const available = widths.filter((input) =>
        input.value === 'min' ? slug === 'setup-layout' : Number(input.dataset.previewWidth) <= innerWidth,
      );
      for (const input of widths) input.closest('label').hidden = !available.includes(input);
      fieldset.hidden = !available.length;
      section.querySelector('.layout-preview__caption').hidden = !available.length;
      preview.querySelector('.layout-preview__frame').hidden = !available.length;
      const selected = available.includes(preferredWidth) ? preferredWidth : available.at(-1);
      if (!selected) return;
      selected.checked = true;
      selected.dispatchEvent(new Event('change', { bubbles: true }));
    }
    fieldset.addEventListener('input', ({ target }) => {
      preferredWidth = target;
    });
    window.addEventListener('resize', resize);
    resize();
  }
}
