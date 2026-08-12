import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes the framework-independent runtime entry', async () => {
  const entry = await import('../dist/index.js');

  assert.deepEqual(Object.keys(entry), [
    'CmAccordionController',
    'CmCheckboxController',
    'CmCommandPaletteController',
    'CmDialogController',
    'CmDrawerController',
    'CmDropdownController',
    'CmMenuController',
    'CmPopoverController',
    'CmRuntime',
    'CmTabsController',
    'CmTooltipController',
    'createCmAccordionController',
    'createCmCheckboxController',
    'createCmCommandPaletteController',
    'createCmDialogController',
    'createCmDrawerController',
    'createCmDropdownController',
    'createCmEvent',
    'createCmMenuController',
    'createCmPopoverController',
    'createCmTabsController',
    'createCmTooltipController',
    'dispatchCmEvent',
  ]);
});
