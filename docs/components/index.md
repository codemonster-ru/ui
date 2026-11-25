---
title: 'Component reference'
description: 'Find Vue usage and canonical Vanilla HTML for CodeMonster UI components'
---

# Component reference

Choose a component to find Vue usage and the corresponding HTML contract. Vue components use
the `Cm` prefix and are imported from `@codemonster-ru/ui-vue` unless the guide specifies
`@codemonster-ru/ui-layouts`. Each Vanilla link leads to the component's contract or canonical
HTML. See the `cases` directory for additional states and variants.

Start with the [installation and quick starts](../getting-started.md) for shared styles.
Interactive Vanilla markup may need the [browser runtime](../vanilla.md). See the recipes for
[ThemeProvider](../recipes/theme-switch.md#vue) and
[ConfirmDialog](../recipes/confirm-dialog.md) for their respective Vue and Vanilla integrations.
For compatibility exports, use the [VueForge migration guide](../migrate-from-vueforge.md).

See the [component quality matrix](./quality-matrix.md) for declared states and fixture coverage.

## Actions and forms

| Component | Vue guide | Vanilla contract or HTML |
| --- | --- | --- |
| Button | [Guide](./button.md) | [Contract](../../contracts/button/contract.md) |
| IconButton | [Guide](./icon-button.md) | [Contract](../../contracts/icon-button/contract.md) |
| Link | [Guide](./navigation.md#apis) | [Contract](../../contracts/link/contract.md) |
| Field | [Guide](./forms.md#field-api) | [Contract](../../contracts/field/contract.md) |
| Fieldset | [Guide](./fieldset.md) | [Contract](../../contracts/fieldset/contract.md) |
| Input | [Guide](./forms.md#input-api) | [Contract](../../contracts/input/contract.md) |
| Textarea | [Guide](./forms.md#textarea-and-choice-apis) | [Contract](../../contracts/textarea/contract.md) |
| Checkbox | [Guide](./forms.md#textarea-and-choice-apis) | [Contract](../../contracts/checkbox/contract.md) |
| Radio | [Guide](./forms.md#textarea-and-choice-apis) | [Contract](../../contracts/radio/contract.md) |
| Switch | [Guide](./forms.md#textarea-and-choice-apis) | [Contract](../../contracts/switch/contract.md) |
| Select | [Guide](./advanced-inputs.md#select) | [Contract](../../contracts/select/contract.md) |
| DatePicker | [Guide](./advanced-inputs.md#datepicker) | [Contract](../../contracts/date-picker/contract.md) |
| FormLayout | [Guide](./compositions.md#form-layout) | [Contract](../../contracts/form-layout/contract.md) |
| ThemeSwitch | [Guide](./forms.md#themeswitch-api) | [HTML](../../contracts/theme-switch/cases/default.html) |

## Navigation

| Component | Vue guide | Vanilla contract or HTML |
| --- | --- | --- |
| Accordion | [Guide](./accordion.md) | [Contract](../../contracts/accordion/contract.md) |
| Breadcrumbs | [Guide](./navigation.md#apis) | [Contract](../../contracts/breadcrumbs/contract.md) |
| Tabs | [Guide](./navigation.md#apis) | [Contract](../../contracts/tabs/contract.md) |
| Stepper | [Guide](./navigation.md#stepper) | [HTML](../../contracts/stepper/cases/default.html) |
| NavMenu | [Guide](./navigation.md#nested-navigation) | [Contract](../../contracts/nav-menu/contract.md) |
| MenuBar | [Guide](./navigation.md#menu-bar) | [Contract](../../contracts/menu-bar/contract.md) |
| TableOfContents | [Guide](./navigation.md#table-of-contents) | [HTML](../../contracts/table-of-contents/cases/default.html) |

## Menus and overlays

| Component | Vue guide | Vanilla contract or HTML |
| --- | --- | --- |
| Menu | [Guide](./navigation.md#apis) | [Contract](../../contracts/menu/contract.md) |
| Dropdown | [Guide](./overlays.md#apis) | [Contract](../../contracts/dropdown/contract.md) |
| Popover | [Guide](./overlays.md#apis) | [Contract](../../contracts/popover/contract.md) |
| Tooltip | [Guide](./overlays.md#apis) | [Contract](../../contracts/tooltip/contract.md) |
| Dialog | [Guide](./overlays.md#apis) | [Contract](../../contracts/dialog/contract.md) |
| Drawer | [Guide](./overlays.md#apis) | [Contract](../../contracts/drawer/contract.md) |
| CommandPalette | [Guide](./advanced-inputs.md#commandpalette) | [Contract](../../contracts/command-palette/contract.md) |

## Display and feedback

| Component | Vue guide | Vanilla contract or HTML |
| --- | --- | --- |
| Icon | [Guide](./display.md#icons) | [HTML](../../contracts/icon/cases/default.html) |
| Alert | [Guide](./display.md#props-and-states) | [Contract](../../contracts/alert/contract.md) |
| Avatar | [Guide](./display.md#props-and-states) | [Contract](../../contracts/avatar/contract.md) |
| Badge | [Guide](./display.md#props-and-states) | [Contract](../../contracts/badge/contract.md) |
| Divider | [Guide](./display.md#props-and-states) | [Contract](../../contracts/divider/contract.md) |
| Skeleton | [Guide](./display.md#props-and-states) | [Contract](../../contracts/skeleton/contract.md) |
| SkeletonGate | [Guide](./compositions.md#skeleton-gate) | [Contract](../../contracts/skeleton-gate/contract.md) |
| ProgressBar | [Guide](./progress.md#progress-bar) | [Contract](../../contracts/progress-bar/contract.md) |
| ProgressSpinner | [Guide](./progress.md#progress-spinner) | [Contract](../../contracts/progress-spinner/contract.md) |

## Data tables

| Component | Vue guide | Vanilla contract or HTML |
| --- | --- | --- |
| Table | [Guide](./data-tables.md#table) | [Contract](../../contracts/table/contract.md) |
| DataTable | [Guide](./data-tables.md#datatable-data-model) | [Contract](../../contracts/data-table/contract.md) |
| ColumnChooser | [Guide](./data-tables.md#choosing-columns) | [HTML](../../contracts/column-chooser/cases/default.html) |

## Layout and surfaces

| Component | Vue guide | Vanilla contract or HTML |
| --- | --- | --- |
| Container | [Guide](./layout-primitives.md) | [Contract](../../contracts/container/contract.md) |
| Grid | [Guide](./layout-primitives.md) | [Contract](../../contracts/grid/contract.md) |
| Inline | [Guide](./layout-primitives.md) | [Contract](../../contracts/inline/contract.md) |
| Section | [Guide](./layout-primitives.md) | [Contract](../../contracts/section/contract.md) |
| Stack | [Guide](./layout-primitives.md) | [Contract](../../contracts/stack/contract.md) |
| Card | [Guide](./card.md) | [Contract](../../contracts/card/contract.md) |
| GroupBox | [Guide](./compositions.md#group-box) | [Contract](../../contracts/group-box/contract.md) |
| PageHeader | [Guide](./compositions.md#page-header) | [Contract](../../contracts/page-header/contract.md) |

## Application shells and pages

| Component | Vue guide | Vanilla contract or HTML |
| --- | --- | --- |
| AdminLayout | [Guide](./layouts.md#adminlayout) | [HTML](../../contracts/admin-layout/cases/default.html) |
| AdminShell | [Guide](./layouts.md#adminshell) | [HTML](../../contracts/admin-shell/cases/default.html) |
| AppShell | [Guide](./layouts.md#appshell) | [HTML](../../contracts/app-shell/cases/default.html) |
| AuthLayout | [Guide](./layouts.md#authentication-and-error-layouts) | [Contract](../../contracts/auth-layout/contract.md) |
| DocumentLayout | [Guide](./layouts.md#documentlayout) | [HTML](../../contracts/document-layout/cases/default.html) |
| ErrorLayout | [Guide](./layouts.md#authentication-and-error-layouts) | [Contract](../../contracts/error-layout/contract.md) |
| SetupLayout | [Guide](./layouts.md#setuplayout) | [HTML](../../contracts/setup-layout/cases/default.html) |
| HeaderArea | [Guide](./layouts.md#standalone-shell-regions) | [Contract](../../contracts/header-area/contract.md) |
| SidebarArea | [Guide](./layouts.md#standalone-shell-regions) | [Contract](../../contracts/sidebar-area/contract.md) |
| ContentArea | [Guide](./layouts.md#standalone-shell-regions) | [Contract](../../contracts/content-area/contract.md) |
| AsideArea | [Guide](./layouts.md#standalone-shell-regions) | [Contract](../../contracts/aside-area/contract.md) |
| FooterArea | [Guide](./layouts.md#standalone-shell-regions) | [Contract](../../contracts/footer-area/contract.md) |
