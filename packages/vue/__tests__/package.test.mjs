import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes the Vue component adapter entries', async () => {
  const entry = await import('../dist/index.js');

  assert.deepEqual(Object.keys(entry), [
    'CmAccordion',
    'CmAlert',
    'CmAvatar',
    'CmBadge',
    'CmBreadcrumbs',
    'CmButton',
    'CmCard',
    'CmCheckbox',
    'CmCommandPalette',
    'CmContainer',
    'CmDataTable',
    'CmDatePicker',
    'CmDialog',
    'CmDivider',
    'CmDrawer',
    'CmDropdown',
    'CmField',
    'CmFieldset',
    'CmGrid',
    'CmIconButton',
    'CmInline',
    'CmInput',
    'CmLink',
    'CmMenu',
    'CmPopover',
    'CmProgressBar',
    'CmProgressSpinner',
    'CmRadio',
    'CmSection',
    'CmSelect',
    'CmSkeleton',
    'CmStack',
    'CmSwitch',
    'CmTable',
    'CmTabs',
    'CmTextarea',
    'CmTooltip',
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
