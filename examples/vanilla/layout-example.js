import { followShowcaseFrameTheme } from './showcase-theme.js';
import { createRuntime } from './runtime.js';
import {
  enableAuthPreview,
  followShellPreview,
  mountWarehousePagination,
  revealLayoutPreview,
} from './showcase-layout-recipes.js';
import { selectShowcaseNavItem } from './showcase-inline.mjs';

const root = document.querySelector('[data-layout-example]');
const slug = root.dataset.layoutExample;
const shell = root.querySelector('[data-preview-shell]');
const setup = root.querySelector('.cm-setup-layout');
const form = root.querySelector('[data-layout-auth]');

followShowcaseFrameTheme(() => {});
createRuntime().start(root);
mountWarehousePagination(root);

root.addEventListener('click', ({ target }) => {
  if (!setup) selectShowcaseNavItem(target.closest('[data-cm-nav-menu-value]'));
});

if (slug === 'admin-layout') {
  const trigger = root.querySelector('[data-cm-sidebar-toggle]');
  root.addEventListener('cm:admin-layout-state-change', ({ detail: { sidebarCollapsed } }) => {
    trigger.setAttribute('aria-expanded', String(!sidebarCollapsed));
    trigger.setAttribute('aria-label', sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
  });
}

if (slug === 'admin-shell') {
  const warehouse = root.querySelector('.layout-example__warehouse');
  const trigger = root.querySelector('[data-warehouse-navigation-toggle]');
  const drawer = root.querySelector('#warehouse-drawer');
  const drawerSlot = root.querySelector('#warehouse-drawer-navigation');
  const navigation = root.querySelector('#warehouse-navigation');
  const sidebarSlot = navigation.parentElement;
  const mobile = window.matchMedia(`(width < ${trigger.dataset.warehouseNavigationToggle}px)`);
  const requestClose = () => drawer.dispatchEvent(new CustomEvent('cm:drawer-close-request'));

  function syncWarehouseNavigation({ matches }) {
    if (matches === warehouse.hasAttribute('data-warehouse-mobile')) return;
    const focused = document.activeElement;
    const restoreFocus = document.hasFocus() && (drawer.open || focused === trigger || navigation.contains(focused));
    warehouse.toggleAttribute('data-warehouse-mobile', matches);
    if (!matches) requestClose();
    (matches ? drawerSlot : sidebarSlot).append(navigation);
    if (restoreFocus) {
      const current = navigation.querySelector('[aria-current="page"]');
      const desktopTarget =
        current?.getClientRects().length && getComputedStyle(current).visibility === 'visible'
          ? current
          : navigation.querySelector('button');
      (matches ? trigger : desktopTarget)?.focus({ preventScroll: true });
    }
  }

  trigger.addEventListener('click', () => {
    trigger.focus({ preventScroll: true });
    drawer.dispatchEvent(new CustomEvent('cm:drawer-open-request'));
  });
  drawer.addEventListener('cm:drawer-open-change', ({ detail: { open } }) => {
    trigger.setAttribute('aria-expanded', String(open));
  });
  drawer.addEventListener('click', ({ target }) => {
    if (target.closest('[data-cm-nav-menu-value]:not(:disabled, [aria-disabled="true"])')) requestClose();
  });
  syncWarehouseNavigation(mobile);
  mobile.addEventListener('change', syncWarehouseNavigation);
}

if (shell) {
  const prefix = 'cm-' + slug;
  const modes = ['content', 'sidebar-content', 'sidebar-content-aside'];
  const parts = ['sidebar', 'aside'];
  const region = (key) => shell.querySelector(`.${prefix}__${key}`);

  function setLayout(value) {
    shell.classList.remove(...modes.map((mode) => `${prefix}--${mode}`));
    shell.classList.add(`${prefix}--${value}`);
    for (const [index, key] of parts.entries()) {
      region(key).hidden = modes.indexOf(value) <= index;
    }
  }

  function setOption(key, checked) {
    if (key === 'subheader' || key === 'content-subheader') region(key).hidden = !checked;
    if (key === 'header' || parts.includes(key)) {
      shell.classList.toggle(`${prefix}--${key}-static`, !checked);
      if (slug === 'app-shell' && key === 'header') shell.classList.toggle('cm-app-shell--header-sticky', checked);
    }
    if (key === 'notches') shell.classList.toggle('cm-document-layout--edge-notches', checked);
    if (key === 'plain' && slug === 'document-layout') {
      shell.classList.toggle('layout-example__document--plain-columns', checked);
    }
    if (key === 'plain' && slug === 'app-shell') {
      for (const name of ['sidebar', 'content', 'aside'])
        region(name).classList.toggle('cm-app-shell__region--plain', checked);
    }
  }

  const options = ['plain', 'subheader', 'content-subheader', 'header', ...parts];
  if (slug === 'document-layout') options.push('notches');
  followShellPreview(slug, (layout, selected) => {
    setLayout(layout);
    for (const option of options) setOption(option, selected.includes(option));
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
  enableAuthPreview(form);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const output = form.querySelector('[data-auth-result]');
    output.hidden = false;
  });
}

void revealLayoutPreview(setup ?? root.querySelector('.layout-example__warehouse, .cm-auth-layout, .cm-error-layout'));
