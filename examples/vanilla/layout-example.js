import { followShowcaseFrameTheme } from './showcase-theme.js';
import { createRuntime } from './runtime.js';
import { mountWarehouseFilter } from './showcase-layout-recipes.js';
import { selectShowcaseNavItem } from './showcase-inline.mjs';

const root = document.querySelector('[data-layout-example]');
const slug = root.dataset.layoutExample;
const shell = root.querySelector('[data-preview-shell]');
const setup = root.querySelector('.cm-setup-layout');
const form = root.querySelector('[data-layout-auth]');

followShowcaseFrameTheme(() => {});
createRuntime().start(root);
mountWarehouseFilter(root);

root.addEventListener('click', ({ target }) => {
  if (!setup) selectShowcaseNavItem(target.closest('[data-cm-nav-menu-value]'));
});

if (shell) {
  const prefix = 'cm-' + slug;
  const modes = ['content', 'sidebar-content', 'sidebar-content-aside'];
  const parts = ['sidebar', 'aside'];
  const control = (key) => root.querySelector(`[data-region-control="${key}"]`);
  const region = (key) => shell.querySelector(`.${prefix}__${key}`);

  function setLayout(value) {
    shell.classList.remove(...modes.map((mode) => `${prefix}--${mode}`));
    shell.classList.add(`${prefix}--${value}`);
    for (const [index, key] of parts.entries()) {
      const shown = modes.indexOf(value) > index;
      control(key).closest('label').hidden = !shown;
      region(key).hidden = !shown;
    }
  }

  root.addEventListener('cm:tabs-value-change', ({ detail: { value } }) => setLayout(value));
  root.addEventListener('change', ({ target }) => {
    const key = target.dataset.regionControl;
    if (key === 'subheader' || key === 'content-subheader') region(key).hidden = !target.checked;
    if (key === 'header' || parts.includes(key)) {
      shell.classList.toggle(`${prefix}--${key}-static`, !target.checked);
      if (slug === 'app-shell' && key === 'header')
        shell.classList.toggle('cm-app-shell--header-sticky', target.checked);
    }
    if (key === 'notches') shell.classList.toggle('cm-document-layout--edge-notches', target.checked);
    if (key === 'plain') {
      for (const name of ['sidebar', 'content', 'aside'])
        region(name).classList.toggle('cm-app-shell__region--plain', target.checked);
    }
  });
}

if (setup) {
  const setupPanels = [...setup.querySelectorAll('[data-preview-step]')];
  let step = setupPanels.findIndex((panel) => !panel.hidden);
  function advanceSetup() {
    if (step === setupPanels.length - 1) setup.querySelector('[data-setup-complete]').hidden = false;
    else setStep(step + 1);
  }
  function setStep(next) {
    step = Math.max(0, Math.min(next, setupPanels.length - 1));
    const progress = setup.querySelector('[data-setup-progress]');
    progress.querySelector('span').textContent = `Step ${step + 1} of ${setupPanels.length}`;
    const bar = progress.querySelector('.cm-progress-bar');
    bar.setAttribute('aria-valuenow', String(step + 1));
    bar.querySelector('.cm-progress-bar__value').style.inlineSize = ((step + 1) / setupPanels.length) * 100 + '%';
    const active = setupPanels[step];
    for (const panel of setupPanels) panel.hidden = panel !== active;
    const item = setup.querySelector(`[data-cm-nav-menu-value="${active.dataset.previewStep}"]`);
    selectShowcaseNavItem(item);
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

  setup.addEventListener('click', ({ target }) => {
    const item = target.closest('[data-cm-nav-menu-value]');
    if (item) setStep(setupPanels.findIndex((panel) => panel.dataset.previewStep === item.dataset.cmNavMenuValue));
    if (target.closest('[data-preview-next]')) advanceSetup();
    if (target.closest('[data-preview-back]')) setStep(step - 1);
  });
  setup.addEventListener('cm:setup-layout-next', advanceSetup);
  setup.addEventListener('cm:setup-layout-back', () => setStep(step - 1));
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const output = form.querySelector('[data-auth-result]');
    output.hidden = false;
  });
}
