import {
  CmRuntime,
  createCmAccordionController,
  createCmAdminLayoutController,
  createCmAppShellController,
  createCmCheckboxController,
  createCmCommandPaletteController,
  createCmDataTableController,
  createCmDatePickerController,
  createCmDialogController,
  createCmDrawerController,
  createCmDropdownController,
  createCmInputController,
  createCmMenuController,
  createCmMenuBarController,
  createCmNavMenuController,
  createCmPopoverController,
  createCmSelectController,
  createCmSetupLayoutController,
  createCmShellMetricsController,
  createCmStepperController,
  createCmSwitchController,
  createCmTabsController,
  createCmThemeSwitchController,
  createCmTooltipController,
} from '@codemonster-ru/ui-runtime';

export function createRuntime() {
  return new CmRuntime()
    .register('accordion', createCmAccordionController)
    .register('admin-layout', createCmAdminLayoutController)
    .register('app-shell', createCmAppShellController)
    .register('checkbox', createCmCheckboxController)
    .register('command-palette', createCmCommandPaletteController)
    .register('data-table', createCmDataTableController)
    .register('date-picker', createCmDatePickerController)
    .register('dialog', createCmDialogController)
    .register('drawer', createCmDrawerController)
    .register('dropdown', createCmDropdownController)
    .register('input', createCmInputController)
    .register('menu', createCmMenuController)
    .register('menu-bar', createCmMenuBarController)
    .register('nav-menu', createCmNavMenuController)
    .register('popover', createCmPopoverController)
    .register('select', createCmSelectController)
    .register('setup-layout', createCmSetupLayoutController)
    .register('shell-metrics', createCmShellMetricsController)
    .register('stepper', createCmStepperController)
    .register('switch', createCmSwitchController)
    .register('tabs', createCmTabsController)
    .register('theme-switch', createCmThemeSwitchController)
    .register('tooltip', createCmTooltipController);
}
