import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToString } from '@vue/server-renderer';
import { h } from 'vue';

test('publishes the Vue component adapter entries', async () => {
  const entry = await import('@codemonster-ru/ui-vue');

  assert.deepEqual(Object.keys(entry), [
    'CmAccordion',
    'CmAlert',
    'CmAvatar',
    'CmBadge',
    'CmBreadcrumbs',
    'CmButton',
    'CmCard',
    'CmCheckbox',
    'CmColumnChooser',
    'CmCommandPalette',
    'CmConfirmDialog',
    'CmContainer',
    'CmDataTable',
    'CmDatePicker',
    'CmDialog',
    'CmDivider',
    'CmDrawer',
    'CmDropdown',
    'CmField',
    'CmFieldset',
    'CmFormLayout',
    'CmGrid',
    'CmGroupBox',
    'CmIcon',
    'CmIconButton',
    'CmInline',
    'CmInput',
    'CmLink',
    'CmMenu',
    'CmMenuBar',
    'CmNavMenu',
    'CmPageHeader',
    'CmPanel',
    'CmPopover',
    'CmProgressBar',
    'CmProgressSpinner',
    'CmRadio',
    'CmSection',
    'CmSelect',
    'CmSkeleton',
    'CmSkeletonGate',
    'CmStack',
    'CmStepper',
    'CmSwitch',
    'CmTable',
    'CmTableOfContents',
    'CmTabs',
    'CmTag',
    'CmTextarea',
    'CmThemeProvider',
    'CmThemeSwitch',
    'CmTooltip',
    'VfButton',
    'VfCommandPalette',
    'VfConfirmDialog',
    'VfField',
    'VfFormLayout',
    'VfGroupBox',
    'VfLink',
    'VfPageHeader',
    'VfPanel',
    'VfProgressBar',
    'VfSkeletonGate',
    'VfThemeProvider',
    'VfThemeSwitch',
    'VfTooltip',
    'createAsyncWithSkeleton',
    'useCmTheme',
    'useTheme',
  ]);
  assert.equal(entry.CmAccordion.__name, 'CmAccordion');
  assert.equal(entry.CmButton.__name, 'CmButton');
  assert.equal(entry.CmCard.__name, 'CmCard');
  assert.equal(entry.CmField.__name, 'CmField');
  assert.equal(entry.CmFieldset.__name, 'CmFieldset');
  assert.equal(entry.CmIconButton.__name, 'CmIconButton');
  assert.equal(entry.CmInput.__name, 'CmInput');
  assert.equal(entry.CmProgressBar.__name, 'CmProgressBar');
  assert.equal(entry.CmProgressSpinner.__name, 'CmProgressSpinner');
  assert.equal(entry.CmAlert.__name, 'CmAlert');
  assert.equal(entry.CmAvatar.__name, 'CmAvatar');
  assert.equal(entry.CmBadge.__name, 'CmBadge');
  assert.equal(entry.CmDivider.__name, 'CmDivider');
  assert.equal(entry.CmSkeleton.__name, 'CmSkeleton');
});

test('publishes the opt-in historical icon and Vue components', async () => {
  const entry = await import('@codemonster-ru/ui-vue/historical');

  assert.deepEqual(Object.keys(entry), [
    'VfAlert',
    'VfAvatar',
    'VfBadge',
    'VfIconButton',
    'VfInput',
    'VfMenu',
    'VfMenuItem',
    'VfProgressSpinner',
    'VfSelect',
    'VfTag',
    'VueIconify',
  ]);
  assert.match(await renderToString(h(entry.VfMenu, null, () => 'Actions')), /role="menu"[\s\S]*Actions/u);
  assert.match(await renderToString(h(entry.VueIconify)), /<svg[^>]+aria-hidden="true"/u);
  const button = await renderToString(
    h(entry.VfIconButton, { icon: 'gear', variant: 'warn', 'aria-label': 'Settings' }),
  );
  assert.match(button, /<button[^>]*class="[^"]*cm-icon-button--warn/u);
  assert.match(button, /aria-label="Settings"[\s\S]*<svg/u);
  const select = await renderToString(
    h(entry.VfSelect, {
      'aria-label': 'Frequency',
      leadingIcon: 'gear',
      placement: 'bottom-end',
      options: [{ value: 'weekly', label: 'Weekly' }],
    }),
  );
  const listboxId = /aria-controls="([^"]+)"/u.exec(select)?.[1];
  assert.ok(listboxId);
  assert.ok(select.includes(`id="${listboxId}"`));
  assert.match(select, /cm-select__icon--leading[\s\S]*<svg/u);
  assert.match(select, /data-cm-placement="bottom-end"/u);
});
