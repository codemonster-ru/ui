# Component quality matrix

The [visual quality matrix](../verification/reference-visual-quality.md) records the combined product review.

Inventory taken from the `2.0.0-rc.2` contract tree at `857c0e39`. Each component
links to its manifest with the inputs, slots, events, defaults, and declared states.
Use the [component reference](./index.md) for framework examples and canonical HTML.

- **Vue package** gives the root entry for the `Cm` export. The significant-DOM gate
  checks Vue SSR against canonical markup in every row.
- **HTML hooks** lists the runtime controllers present in the component's HTML cases,
  including any nested examples. A dash means the tested markup declares no hook.
  Native links, inputs, and form behavior remain available according to the component contract.
- **Cases / scenarios** counts the paired semantic HTML cases and documented interaction
  scenarios. Case presence shows coverage intent. The [roadmap](../reference-quality.md)
  records executed checks and their scope.
- Manifest states describe supported behavior or rendering. This inventory records the
  presence of test cases. A state can rely on shared tests or still need focused browser evidence.

## Actions and forms

| Component | Vue package | Declared states | HTML hooks | Cases / scenarios |
| --- | --- | --- | --- | ---: |
| [`CmButton`](../../contracts/button/manifest.json) | `ui-vue` | default, disabled, loading | — | 11 / 0 |
| [`CmIconButton`](../../contracts/icon-button/manifest.json) | `ui-vue` | default, disabled | — | 3 / 0 |
| [`CmLink`](../../contracts/link/manifest.json) | `ui-vue` | default, muted | — | 2 / 0 |
| [`CmField`](../../contracts/field/manifest.json) | `ui-vue` | default, required, invalid, floating | date-picker | 6 / 1 |
| [`CmFieldset`](../../contracts/fieldset/manifest.json) | `ui-vue` | default, invalid | — | 2 / 0 |
| [`CmInput`](../../contracts/input/manifest.json) | `ui-vue` | default, disabled, readonly, invalid, password-visible | input | 7 / 4 |
| [`CmTextarea`](../../contracts/textarea/manifest.json) | `ui-vue` | default, disabled, readonly, invalid | — | 3 / 2 |
| [`CmCheckbox`](../../contracts/checkbox/manifest.json) | `ui-vue` | default, checked, indeterminate, disabled, invalid | checkbox | 3 / 2 |
| [`CmRadio`](../../contracts/radio/manifest.json) | `ui-vue` | default, checked, disabled, invalid | — | 3 / 1 |
| [`CmSwitch`](../../contracts/switch/manifest.json) | `ui-vue` | default, checked, disabled, invalid | switch | 4 / 1 |
| [`CmSelect`](../../contracts/select/manifest.json) | `ui-vue` | default, selected, open, invalid, disabled | select | 3 / 2 |
| [`CmDatePicker`](../../contracts/date-picker/manifest.json) | `ui-vue` | default, value, clearable, invalid, disabled, readonly | date-picker | 9 / 2 |
| [`CmFormLayout`](../../contracts/form-layout/manifest.json) | `ui-vue` | stacked, horizontal, responsive | — | 1 / 0 |
| [`CmThemeSwitch`](../../contracts/theme-switch/manifest.json) | `ui-vue` | checked, disabled | theme-switch | 1 / 1 |

## Navigation

| Component | Vue package | Declared states | HTML hooks | Cases / scenarios |
| --- | --- | --- | --- | ---: |
| [`CmAccordion`](../../contracts/accordion/manifest.json) | `ui-vue` | default, open, disabled | accordion | 5 / 6 |
| [`CmBreadcrumbs`](../../contracts/breadcrumbs/manifest.json) | `ui-vue` | default, disabled, current | — | 2 / 0 |
| [`CmTabs`](../../contracts/tabs/manifest.json) | `ui-vue` | default, selected, disabled | tabs | 5 / 2 |
| [`CmStepper`](../../contracts/stepper/manifest.json) | `ui-vue` | complete, current, upcoming, disabled | stepper | 3 / 2 |
| [`CmNavMenu`](../../contracts/nav-menu/manifest.json) | `ui-vue` | default, expanded, active, disabled, pills, compact | nav-menu | 4 / 3 |
| [`CmMenuBar`](../../contracts/menu-bar/manifest.json) | `ui-vue` | default, open, active, disabled, pills | menu-bar | 4 / 4 |
| [`CmTableOfContents`](../../contracts/table-of-contents/manifest.json) | `ui-vue` | default, active | table-of-contents | 2 / 1 |

## Menus and overlays

| Component | Vue package | Declared states | HTML hooks | Cases / scenarios |
| --- | --- | --- | --- | ---: |
| [`CmMenu`](../../contracts/menu/manifest.json) | `ui-vue` | default, active, disabled, danger | menu | 3 / 2 |
| [`CmDropdown`](../../contracts/dropdown/manifest.json) | `ui-vue` | closed, open, disabled | dropdown, menu | 5 / 5 |
| [`CmPopover`](../../contracts/popover/manifest.json) | `ui-vue` | closed, open, disabled | popover | 4 / 4 |
| [`CmTooltip`](../../contracts/tooltip/manifest.json) | `ui-vue` | hidden, visible | tooltip | 4 / 3 |
| [`CmDialog`](../../contracts/dialog/manifest.json) | `ui-vue` | closed, open | dialog | 4 / 4 |
| [`CmDrawer`](../../contracts/drawer/manifest.json) | `ui-vue` | closed, open | drawer | 6 / 3 |
| [`CmCommandPalette`](../../contracts/command-palette/manifest.json) | `ui-vue` | closed, open, loading, idle, filtered, empty | command-palette | 6 / 4 |

## Display and feedback

| Component | Vue package | Declared states | HTML hooks | Cases / scenarios |
| --- | --- | --- | --- | ---: |
| [`CmIcon`](../../contracts/icon/manifest.json) | `ui-vue` | — | — | 2 / 0 |
| [`CmAlert`](../../contracts/alert/manifest.json) | `ui-vue` | default | — | 2 / 0 |
| [`CmAvatar`](../../contracts/avatar/manifest.json) | `ui-vue` | default | — | 2 / 0 |
| [`CmBadge`](../../contracts/badge/manifest.json) | `ui-vue` | default | — | 3 / 0 |
| [`CmTag`](../../contracts/tag/manifest.json) | `ui-vue` | default | — | 3 / 0 |
| [`CmDivider`](../../contracts/divider/manifest.json) | `ui-vue` | default | — | 2 / 0 |
| [`CmSkeleton`](../../contracts/skeleton/manifest.json) | `ui-vue` | default, animated | — | 2 / 0 |
| [`CmSkeletonGate`](../../contracts/skeleton-gate/manifest.json) | `ui-vue` | loading, ready | — | 2 / 0 |
| [`CmProgressBar`](../../contracts/progress-bar/manifest.json) | `ui-vue` | determinate, indeterminate | — | 3 / 0 |
| [`CmProgressSpinner`](../../contracts/progress-spinner/manifest.json) | `ui-vue` | indeterminate | — | 3 / 0 |

## Data tables

| Component | Vue package | Declared states | HTML hooks | Cases / scenarios |
| --- | --- | --- | --- | ---: |
| [`CmTable`](../../contracts/table/manifest.json) | `ui-vue` | default, compact, striped, column-dividers, sticky-header | — | 2 / 0 |
| [`CmDataTable`](../../contracts/data-table/manifest.json) | `ui-vue` | default, sorted, selected, paginated, empty, loading, error | data-table | 7 / 5 |
| [`CmColumnChooser`](../../contracts/column-chooser/manifest.json) | `ui-vue` | default, open, disabled, mixed | column-chooser, popover | 1 / 3 |

## Layout and surfaces

| Component | Vue package | Declared states | HTML hooks | Cases / scenarios |
| --- | --- | --- | --- | ---: |
| [`CmContainer`](../../contracts/container/manifest.json) | `ui-vue` | default, md, lg, xl, 2xl, fluid | — | 3 / 0 |
| [`CmGrid`](../../contracts/grid/manifest.json) | `ui-vue` | default | — | 1 / 0 |
| [`CmInline`](../../contracts/inline/manifest.json) | `ui-vue` | default, nowrap | — | 2 / 0 |
| [`CmSection`](../../contracts/section/manifest.json) | `ui-vue` | default, surface | — | 2 / 0 |
| [`CmStack`](../../contracts/stack/manifest.json) | `ui-vue` | default | — | 1 / 0 |
| [`CmCard`](../../contracts/card/manifest.json) | `ui-vue` | default, compact | — | 5 / 0 |
| [`CmGroupBox`](../../contracts/group-box/manifest.json) | `ui-vue` | default, collapsed, disabled | group-box | 1 / 1 |
| [`CmPanel`](../../contracts/panel/manifest.json) | `ui-vue` | default, subtle | — | 2 / 0 |
| [`CmPageHeader`](../../contracts/page-header/manifest.json) | `ui-vue` | default | — | 1 / 0 |

## Application shells and pages

| Component | Vue package | Declared states | HTML hooks | Cases / scenarios |
| --- | --- | --- | --- | ---: |
| [`CmAdminLayout`](../../contracts/admin-layout/manifest.json) | `ui-layouts` | default, collapsed, mobile-open | admin-layout | 2 / 1 |
| [`CmAdminShell`](../../contracts/admin-shell/manifest.json) | `ui-layouts` | default | — | 1 / 0 |
| [`CmAppShell`](../../contracts/app-shell/manifest.json) | `ui-layouts` | collapsed, sticky | app-shell, shell-metrics | 2 / 1 |
| [`CmAuthLayout`](../../contracts/auth-layout/manifest.json) | `ui-layouts` | default | — | 1 / 0 |
| [`CmDocumentLayout`](../../contracts/document-layout/manifest.json) | `ui-layouts` | — | shell-metrics | 1 / 1 |
| [`CmErrorLayout`](../../contracts/error-layout/manifest.json) | `ui-layouts` | default | — | 1 / 0 |
| [`CmSetupLayout`](../../contracts/setup-layout/manifest.json) | `ui-layouts` | default | setup-layout | 1 / 1 |
| [`CmHeaderArea`](../../contracts/header-area/manifest.json) | `ui-layouts` | default | — | 1 / 0 |
| [`CmSidebarArea`](../../contracts/sidebar-area/manifest.json) | `ui-layouts` | default | — | 1 / 0 |
| [`CmContentArea`](../../contracts/content-area/manifest.json) | `ui-layouts` | default | — | 1 / 0 |
| [`CmAsideArea`](../../contracts/aside-area/manifest.json) | `ui-layouts` | default | — | 1 / 0 |
| [`CmFooterArea`](../../contracts/footer-area/manifest.json) | `ui-layouts` | default | — | 1 / 0 |

## Product coverage decisions

- Use Table for native tabular structure. Use DataTable when the host supplies sort, selection,
  loading, or pagination state. Try a documented composition before adding table wrappers.
- Keep Menu as a focus and selection primitive, Dropdown as an action trigger, MenuBar for
  application commands, and NavMenu for navigation. Their keyboard and focus contracts explain
  why the visually similar structures exist.
- Preserve the native input, choice, and form primitives. Add an enhanced picker only when
  its interaction and fallback are needed. Keep Field and Fieldset responsible for individual
  fields and grouped controls respectively.
- Use layout primitives for general page structure and the existing application shell recipes
  for repeated layout needs. See the [layout line decision](../architecture/layout-line-ownership.md).
- The Vue ConfirmDialog and ThemeProvider compositions, breakpoint helpers, compatibility exports, and
  Code Block and Playground recipes have separate ownership and examples. See the
  [component reference](./index.md), [recipes](../index.md#maintained-recipes), and
  [VueForge migration guide](../migrate-from-vueforge.md).
- This audit found no demonstrated need to add a component or remove a public variant. Review a
  proposed gap against a real application, the existing compositions, and both integrations.
