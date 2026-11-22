import { followShowcaseTheme, saveShowcaseTheme } from './showcase-theme.js';
import { mountLayoutPreviews } from './showcase-layouts.js';
import { createRuntime } from './runtime.js';
import { fillContrastTable } from './showcase-reference.js';
import { copyIcon, filterIcons } from './showcase-icon-catalog.js';
import { revealShowcaseLink } from './showcase-navigation.js';
import { handleShowcaseDemoClick, selectShowcaseNavItem } from './showcase-inline.mjs';

document.getElementById('showcase-navigation')?.addEventListener('focusin', revealShowcaseLink);

const catalog = document.querySelector('.showcase-catalog');
catalog.addEventListener('click', (event) => {
  const launcher = event.target.closest('[data-showcase-open]');
  const target = launcher?.dataset.showcaseOpen;
  const demo = target ? document.getElementById(target) : event.target.closest('.showcase-demo');
  if (!demo) return;
  if (launcher) {
    const dialog = demo.querySelector('dialog');
    dialog.dispatchEvent(new CustomEvent(`cm:${dialog.dataset.cmController}-open-request`));
  }
  selectShowcaseNavItem(event.target.closest('[data-cm-nav-menu-value]'));
  handleShowcaseDemoClick(demo, event);
});

fillContrastTable(catalog);
mountLayoutPreviews(catalog);
createRuntime().start(catalog);

const columnChooserExample = catalog.querySelector('[data-showcase-example="column-chooser-default"]');
if (columnChooserExample) {
  const table = columnChooserExample.querySelector('table');
  const columnKeys = [...columnChooserExample.querySelectorAll('[data-cm-column-chooser-key]')].map(
    (option) => option.dataset.cmColumnChooserKey,
  );
  columnChooserExample.addEventListener('cm:column-chooser-visible-columns-change', ({ detail }) => {
    const visible = new Set(detail.visibleColumnKeys);
    for (const row of table.rows) {
      for (const cell of row.cells) cell.hidden = !visible.has(columnKeys[cell.cellIndex]);
    }
  });
}

for (const invalidFieldset of catalog.querySelectorAll(
  ':is([data-showcase-example="fieldset-invalid"], [data-showcase-example="fieldset-help-error"]) .cm-fieldset',
)) {
  const error = invalidFieldset.querySelector('.cm-fieldset__error');
  const description = invalidFieldset.querySelector('.cm-fieldset__description');
  const setInvalid = (invalid) => {
    error.hidden = !invalid;
    invalidFieldset.classList.toggle('cm-fieldset--invalid', invalid);
    if (invalid) invalidFieldset.setAttribute('aria-invalid', 'true');
    else invalidFieldset.removeAttribute('aria-invalid');
    const describedBy = [description?.id, invalid ? error.id : null].filter(Boolean).join(' ');
    if (describedBy) invalidFieldset.setAttribute('aria-describedby', describedBy);
    else invalidFieldset.removeAttribute('aria-describedby');
  };
  invalidFieldset.addEventListener('change', ({ target }) => setInvalid(!target.checked));
  invalidFieldset.closest('form')?.addEventListener('reset', () => {
    setInvalid(true);
    invalidFieldset.querySelector('input[type="radio"][value="email"]')?.focus();
  });
}

const confirmationExamples = catalog.querySelector('#demo-confirm-dialog');
if (confirmationExamples) {
  const status = confirmationExamples.querySelector('[data-confirm-result] .cm-tag');
  for (const example of confirmationExamples.querySelectorAll('[data-showcase-example]')) {
    const launcher = example.querySelector('[data-showcase-open]');
    const dialog = example.querySelector('dialog');
    const [cancel, confirm] = dialog.querySelectorAll('.cm-confirm-dialog__actions button');
    const requestClose = () => dialog.dispatchEvent(new CustomEvent('cm:dialog-close-request'));
    const report = (result) => {
      status.textContent = `${launcher.textContent.trim()} · ${result}`;
      status.style.removeProperty('display');
    };
    let confirming = false;

    cancel.setAttribute('data-cm-dialog-close', '');
    confirm.addEventListener('click', () => {
      if (!example.hasAttribute('data-confirm-keep-open')) {
        confirming = true;
        requestClose();
        confirming = false;
      }
      report('Confirmed');
    });
    dialog.addEventListener('cm:dialog-open-change', ({ detail: { open } }) => {
      if (!open && !confirming) report('Cancelled');
    });
    dialog.addEventListener('click', ({ target }) => {
      if (target === dialog && dialog.dataset.cmDialogDismissible !== 'false') requestClose();
    });

    const finish = dialog.querySelector('[data-confirm-finish]');
    if (finish) {
      const close = dialog.querySelector('.cm-dialog__close');
      const surface = dialog.querySelector('.cm-dialog__surface');
      const spinner = confirm.querySelector('.cm-button__spinner');
      const setLoading = (loading) => {
        dialog.dataset.cmDialogDismissible = String(!loading);
        cancel.disabled = confirm.disabled = close.disabled = loading;
        close.style.display = loading ? 'none' : '';
        finish.style.display = loading ? '' : 'none';
        surface.toggleAttribute('data-autofocus', loading);
        cancel.toggleAttribute('data-autofocus', !loading);
        if (loading) {
          confirm.setAttribute('aria-busy', 'true');
          confirm.prepend(spinner);
        } else {
          confirm.removeAttribute('aria-busy');
          spinner.remove();
        }
      };
      launcher.addEventListener('click', () => setLoading(true));
      finish.addEventListener('click', () => {
        setLoading(false);
        cancel.focus();
      });
    }
  }
}

const paginatedTable = catalog.querySelector('[data-showcase-client-pagination]');
if (paginatedTable) {
  const rows = [...paginatedTable.querySelectorAll('[data-cm-data-table-row]')];
  const updatePage = () => {
    const size = Number(paginatedTable.dataset.cmDataTablePageSize);
    const start = (Number(paginatedTable.dataset.cmDataTablePage) - 1) * size;
    rows.forEach((row, index) => {
      row.hidden = index < start || index >= start + size;
    });
  };
  paginatedTable.addEventListener('cm:data-table-page-change', updatePage);
  paginatedTable.addEventListener('cm:data-table-page-size-change', updatePage);
}

const iconCatalog = document.querySelector('#icon-catalog');
iconCatalog?.addEventListener('input', filterIcons);
iconCatalog?.addEventListener('click', copyIcon);

const themeButton = document.querySelector('#showcase-theme');
const themeIcons = document.querySelectorAll('[data-showcase-theme-icon]');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const themeDefault = 'system';
let themeMode = themeDefault;
const isDark = (mode) => mode === 'dark' || (mode === 'system' && systemTheme.matches);
const syncThemeControls = (mode) => {
  themeMode = mode;
  const dark = isDark(mode);
  for (const input of catalog.querySelectorAll(
    '.showcase-demo [data-cm-controller="theme-switch"] input[type="radio"]',
  )) {
    input.checked = input.value === mode;
  }
  for (const icon of themeIcons) {
    icon.toggleAttribute('hidden', icon.dataset.showcaseThemeIcon !== (dark ? 'moon' : 'sun'));
  }
  themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  themeButton.hidden = false;
};
followShowcaseTheme(syncThemeControls, themeDefault);
systemTheme.addEventListener('change', () => syncThemeControls(themeMode));
function selectTheme(mode) {
  const next = mode === 'toggle' ? (isDark(themeMode) ? 'light' : 'dark') : mode;
  saveShowcaseTheme(next);
  syncThemeControls(next);
}
themeButton.addEventListener('click', () => selectTheme('toggle'));
catalog.addEventListener('cm:theme-change', (event) => {
  selectTheme(event.detail.mode);
});
