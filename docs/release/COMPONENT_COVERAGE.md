# CodeMonster UI 2.0 component coverage

The public catalog below reconciles the canonical manifests with the Vue and Layouts root
exports. Vanilla uses each linked canonical HTML contract and opts into the matching runtime
controller where the contract specifies one. The inventory has 62 components, 181 canonical cases
and 72 scripted behavior scenarios. A dash means the contract has no dedicated scenario under
`contracts/<component>/behavior`.

Canonical cases provide fixtures for shared markup, named variants and states, automated
accessibility, and adapter comparison. Behavior scenarios exercise applicable focus, keyboard
navigation, native forms, pointer and state updates. The component's contract defines expected
SSR and no-script behavior. Package tests and historical adapter coverage supplement the
canonical fixtures. [Prior product coverage](../verification/product-quality.md#coverage-map)

| Component and contract | Vue distribution | Fixture cases | Behavior scenarios |
| --- | --- | ---: | ---: |
| [Accordion](../../contracts/accordion/contract.md) | `ui-vue` | 5 | 6 |
| [AdminLayout](../../contracts/admin-layout/contract.md) | `ui-layouts` | 2 | 1 |
| [AdminShell](../../contracts/admin-shell/contract.md) | `ui-layouts` | 1 | — |
| [Alert](../../contracts/alert/contract.md) | `ui-vue` | 2 | — |
| [AppShell](../../contracts/app-shell/contract.md) | `ui-layouts` | 2 | 1 |
| [AsideArea](../../contracts/aside-area/contract.md) | `ui-layouts` | 1 | — |
| [AuthLayout](../../contracts/auth-layout/contract.md) | `ui-layouts` | 1 | — |
| [Avatar](../../contracts/avatar/contract.md) | `ui-vue` | 2 | — |
| [Badge](../../contracts/badge/contract.md) | `ui-vue` | 3 | — |
| [Breadcrumbs](../../contracts/breadcrumbs/contract.md) | `ui-vue` | 2 | — |
| [Button](../../contracts/button/contract.md) | `ui-vue` | 11 | — |
| [Card](../../contracts/card/contract.md) | `ui-vue` | 5 | — |
| [Checkbox](../../contracts/checkbox/contract.md) | `ui-vue` | 3 | 2 |
| [ColumnChooser](../../contracts/column-chooser/contract.md) | `ui-vue` | 1 | 3 |
| [CommandPalette](../../contracts/command-palette/contract.md) | `ui-vue` | 6 | 4 |
| [Container](../../contracts/container/contract.md) | `ui-vue`, `ui-layouts` | 3 | — |
| [ContentArea](../../contracts/content-area/contract.md) | `ui-layouts` | 1 | — |
| [DataTable](../../contracts/data-table/contract.md) | `ui-vue` | 7 | 5 |
| [DatePicker](../../contracts/date-picker/contract.md) | `ui-vue` | 9 | 2 |
| [Dialog](../../contracts/dialog/contract.md) | `ui-vue` | 4 | 4 |
| [Divider](../../contracts/divider/contract.md) | `ui-vue` | 2 | — |
| [DocumentLayout](../../contracts/document-layout/contract.md) | `ui-layouts` | 1 | 1 |
| [Drawer](../../contracts/drawer/contract.md) | `ui-vue` | 6 | 3 |
| [Dropdown](../../contracts/dropdown/contract.md) | `ui-vue` | 5 | 5 |
| [ErrorLayout](../../contracts/error-layout/contract.md) | `ui-layouts` | 1 | — |
| [Field](../../contracts/field/contract.md) | `ui-vue` | 6 | 1 |
| [Fieldset](../../contracts/fieldset/contract.md) | `ui-vue` | 2 | — |
| [FooterArea](../../contracts/footer-area/contract.md) | `ui-layouts` | 1 | — |
| [FormLayout](../../contracts/form-layout/contract.md) | `ui-vue` | 1 | — |
| [Grid](../../contracts/grid/contract.md) | `ui-vue`, `ui-layouts` | 1 | — |
| [GroupBox](../../contracts/group-box/contract.md) | `ui-vue` | 1 | 1 |
| [HeaderArea](../../contracts/header-area/contract.md) | `ui-layouts` | 1 | — |
| [Icon](../../contracts/icon/contract.md) | `ui-vue` | 2 | — |
| [IconButton](../../contracts/icon-button/contract.md) | `ui-vue` | 3 | — |
| [Inline](../../contracts/inline/contract.md) | `ui-vue`, `ui-layouts` | 2 | — |
| [Input](../../contracts/input/contract.md) | `ui-vue` | 7 | 4 |
| [Link component](../../contracts/link/contract.md) | `ui-vue` | 2 | — |
| [Menu](../../contracts/menu/contract.md) | `ui-vue` | 3 | 2 |
| [MenuBar](../../contracts/menu-bar/contract.md) | `ui-vue` | 4 | 4 |
| [NavMenu](../../contracts/nav-menu/contract.md) | `ui-vue` | 4 | 3 |
| [PageHeader](../../contracts/page-header/contract.md) | `ui-vue` | 1 | — |
| [Panel](../../contracts/panel/contract.md) | `ui-vue` | 2 | — |
| [Popover](../../contracts/popover/contract.md) | `ui-vue` | 4 | 4 |
| [ProgressBar](../../contracts/progress-bar/contract.md) | `ui-vue` | 3 | — |
| [ProgressSpinner](../../contracts/progress-spinner/contract.md) | `ui-vue` | 3 | — |
| [Radio](../../contracts/radio/contract.md) | `ui-vue` | 3 | 1 |
| [Section](../../contracts/section/contract.md) | `ui-vue`, `ui-layouts` | 2 | — |
| [Select](../../contracts/select/contract.md) | `ui-vue` | 3 | 2 |
| [SetupLayout](../../contracts/setup-layout/contract.md) | `ui-layouts` | 1 | 1 |
| [SidebarArea](../../contracts/sidebar-area/contract.md) | `ui-layouts` | 1 | — |
| [Skeleton](../../contracts/skeleton/contract.md) | `ui-vue` | 2 | — |
| [SkeletonGate](../../contracts/skeleton-gate/contract.md) | `ui-vue` | 2 | — |
| [Stack](../../contracts/stack/contract.md) | `ui-vue`, `ui-layouts` | 1 | — |
| [Stepper](../../contracts/stepper/contract.md) | `ui-vue` | 3 | 2 |
| [Switch](../../contracts/switch/contract.md) | `ui-vue` | 4 | 1 |
| [Table](../../contracts/table/contract.md) | `ui-vue` | 2 | — |
| [TableOfContents](../../contracts/table-of-contents/contract.md) | `ui-vue` | 2 | 1 |
| [Tabs](../../contracts/tabs/contract.md) | `ui-vue` | 5 | 2 |
| [Tag](../../contracts/tag/contract.md) | `ui-vue` | 3 | — |
| [Textarea](../../contracts/textarea/contract.md) | `ui-vue` | 3 | 2 |
| [ThemeSwitch](../../contracts/theme-switch/contract.md) | `ui-vue` | 1 | 1 |
| [Tooltip](../../contracts/tooltip/contract.md) | `ui-vue` | 4 | 3 |

## Manual coverage

Run the [RC.2 assistive technology script](../verification/codemonster-ui-2.0-rc.2.md#manual-assistive-technology-acceptance)
on both production showcases. Check each supported theme, 200% text size and narrow layout,
keyboard/pointer/touch behavior, visible focus and reduced motion, and record native high
contrast and screen reader results where applicable. Consult the [gate table](QUALITY_GATES.md)
for the candidate's evidence and outstanding verification.
