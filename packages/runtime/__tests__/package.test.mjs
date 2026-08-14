import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes the framework-independent runtime entry', async () => {
  const entry = await import('../dist/index.js');

  assert.deepEqual(Object.keys(entry), [
    'CmAccordionController',
    'CmCheckboxController',
    'CmCommandPaletteController',
    'CmDataTableController',
    'CmDialogController',
    'CmDrawerController',
    'CmDropdownController',
    'CmInputController',
    'CmMenuController',
    'CmPopoverController',
    'CmRuntime',
    'CmTabsController',
    'CmTooltipController',
    'createCmAccordionController',
    'createCmCheckboxController',
    'createCmCommandPaletteController',
    'createCmDataTableController',
    'createCmDialogController',
    'createCmDrawerController',
    'createCmDropdownController',
    'createCmEvent',
    'createCmInputController',
    'createCmMenuController',
    'createCmPopoverController',
    'createCmTabsController',
    'createCmTooltipController',
    'dispatchCmEvent',
  ]);
});
