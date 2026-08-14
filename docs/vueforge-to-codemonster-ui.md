# VueForge to CodeMonster UI mapping

This is the public migration map for the frozen
[VueForge feature baseline](./vueforge-feature-baseline.md). The machine-readable source used by
migration tooling is
[`migration/vueforge-to-codemonster-ui.json`](../migration/vueforge-to-codemonster-ui.json).

## Package mapping

| VueForge package                  | Action                             | CodeMonster UI destination                       |
| --------------------------------- | ---------------------------------- | ------------------------------------------------ |
| `vueforge-theme`                  | Replace manually                   | `ui-tokens` and `ui-css`                         |
| `vueforge-core`                   | Migrate by component               | `ui-vue`, `ui-css`, and optional `ui-runtime`    |
| `vueforge-layouts`                | Migrate primitives; compose shells | `ui-vue` and `ui-css`                            |
| `vueforge-icons`                  | Retain                             | No CodeMonster UI 1.0 replacement is implemented |
| `vueforge-codeblock`              | Retain                             | Dedicated VueForge composed product              |
| `vueforge-playground-core`        | Retain                             | Dedicated VueForge Playground product            |
| `vueforge-playground`             | Retain                             | Dedicated VueForge Playground product            |
| `vueforge-playground-vite-plugin` | Retain                             | Dedicated VueForge build integration             |

Retained packages are supported side-by-side dependencies, not compatibility aliases inside the new
packages. Theme migration is manual because token names and ownership changed.

## Migration sequence and dependency cleanup

For a Vue application, install or link `@codemonster-ru/ui-tokens`,
`@codemonster-ru/ui-css`, and `@codemonster-ru/ui-vue`. For an Annabel Razor application, install
`codemonster-ru/ui-razor` through Composer. Add `@codemonster-ru/ui-runtime` only when
server-rendered Razor or plain HTML needs progressive enhancement; do not attach its controllers to
roots already owned by Vue.

Run the checker and codemod, then migrate the reported direct, composition, and manual outcomes,
including theme attributes, token names, stylesheet ownership, and application-owned state. Re-run
the migration checker together with the relevant package and consumer tests before removing direct
application dependencies on `vueforge-core`, `vueforge-layouts`, or `vueforge-theme`. Remove them
only after source imports, legacy styles, theme bootstrap code, and manual findings are gone.

Retained products remain valid side-by-side dependencies. In particular,
`vueforge-playground` can keep `vueforge-core` transitively; migration completion means the
application no longer owns the migrated foundations directly, not that every legacy package has
disappeared from the lockfile.

## Lifecycle

VueForge design-system foundations are in maintenance: critical security and correctness fixes
continue, but new shared components and foundations belong in CodeMonster UI. No existing package
is unpublished, and maintenance does not imply a blanket npm deprecation. Package deprecation is
allowed only when every condition in the
[VueForge migration policy](./architecture/vueforge-migration-policy.md#deprecation) is satisfied.

CodeBlock and the Playground family remain separately maintained products. Icons remain a
supported side-by-side package because CodeMonster UI 1.0 has no verified icon replacement.

## Direct component replacements

The following 37 names have reviewed cross-platform contracts and implemented `ui-vue` and Annabel
Razor targets. The import/name codemod can establish their CodeMonster UI names, but it deliberately
does not rewrite props, slots, events, state ownership, or progressive-enhancement setup. Review
those API changes against the component guides after every codemod run.

| VueForge           | CodeMonster UI     | VueForge            | CodeMonster UI      |
| ------------------ | ------------------ | ------------------- | ------------------- |
| `VfAccordion`      | `CmAccordion`      | `VfAlert`           | `CmAlert`           |
| `VfAvatar`         | `CmAvatar`         | `VfBadge`           | `CmBadge`           |
| `VfBreadcrumbs`    | `CmBreadcrumbs`    | `VfButton`          | `CmButton`          |
| `VfCard`           | `CmCard`           | `VfCheckbox`        | `CmCheckbox`        |
| `VfCommandPalette` | `CmCommandPalette` | `VfDataTable`       | `CmDataTable`       |
| `VfDatePicker`     | `CmDatePicker`     | `VfDialog`          | `CmDialog`          |
| `VfDivider`        | `CmDivider`        | `VfDrawer`          | `CmDrawer`          |
| `VfDropdown`       | `CmDropdown`       | `VfField`           | `CmField`           |
| `VfFieldset`       | `CmFieldset`       | `VfIconButton`      | `CmIconButton`      |
| `VfInput`          | `CmInput`          | `VfLink`            | `CmLink`            |
| `VfMenu`           | `CmMenu`           | `VfPopover`         | `CmPopover`         |
| `VfProgressBar`    | `CmProgressBar`    | `VfProgressSpinner` | `CmProgressSpinner` |
| `VfRadio`          | `CmRadio`          | `VfSelect`          | `CmSelect`          |
| `VfSkeleton`       | `CmSkeleton`       | `VfSwitch`          | `CmSwitch`          |
| `VfTable`          | `CmTable`          | `VfTabs`            | `CmTabs`            |
| `VfTextarea`       | `CmTextarea`       | `VfTooltip`         | `CmTooltip`         |
| `VfContainer`      | `CmContainer`      | `VfStack`           | `CmStack`           |
| `VfInline`         | `CmInline`         | `VfSection`         | `CmSection`         |
| `VfGrid`           | `CmGrid`           |                     |                     |

## Composition and manual review

The compose and manual cohort review is complete; these entries are not safe rename
targets. ConfirmDialog, FormLayout, Panel, PageHeader, AuthLayout, ErrorLayout, GroupBox,
SkeletonGate, and ThemeSwitch have [maintained recipes](./index.md#maintained-recipes) that preserve
their portable composition and document application-owned policy. Fieldset, IconButton,
ProgressBar, and ProgressSpinner are now direct replacements with
bounded portable contracts. DataTable column choice, Menubar, navigation trees, Stepper, and Table
of Contents have final manual outcomes
because their state and enhancement policy remain application-owned. ThemeSwitch, application
shells, SetupLayout, and shell-internal areas remain application-owned. Native HTML and the listed
CodeMonster UI primitives are preferred where sufficient; the codemod reports these entries for
manual migration and never rewrites them.

Apply the final manual migrations as follows:

- compose `VfDataTableColumnChooser` from Checkbox plus Popover or Dialog, persist the ordered
  choice in the application, and pass it to `CmDataTable.visibleColumnKeys`;
- replace `VfMenuBar` with flat native links or buttons arranged by `CmInline`; the application owns
  current location and history, and ordinary site navigation does not adopt ARIA menubar behavior;
- rebuild `VfNavMenu` as an application-owned native navigation tree; routing, authorization,
  active location, disclosure, compact mode, and responsive state do not belong to `CmMenu`;
- render `VfStepper` as an ordered list with `aria-current="step"`, adding links or buttons only
  when workflow validation and navigation policy permit them and a `nav` landmark only in that
  navigable form;
- render `VfTableOfContents` as labelled native navigation and links with application-supplied
  `aria-current="location"`. Keep fragment navigation functional without JavaScript; heading
  discovery, active-section observation, history, smooth scrolling, and sticky offsets stay in the
  document application.
- rebuild App, Admin, Document, and Setup shells from native landmarks, layout primitives, and the
  maintained recipes. The application retains routing, authorization, responsive navigation,
  focus restoration, sticky measurements, workflow commands, and shell-area placement; the legacy
  Header/Sidebar/Content/Aside/Footer wrappers do not become standalone components.

`VfTag` is superseded by `CmBadge`; the only representative usage was the color showcase and did
not justify a distinct outlined component contract. Migrate it manually and rename the legacy
`warn` tone to `warning`; the other shared semantic tone names carry across directly.

The complete reasons and remaining roadmap destinations are recorded in the
[component disposition audit](./verification/component-disposition-audit.md) and the
[machine-readable coverage inventory](../migration/codemonster-ui-coverage.json).

## Direct replacement API migration

Use the focused component guides as the public migration boundary instead of treating a successful
rename as API compatibility:

- [Button](./components/button.md), [Card](./components/card.md),
  [forms](./components/forms.md), and [Accordion](./components/accordion.md) cover native action and
  form behavior, trusted regions, stable caller-owned ids, collection state, and required Razor
  enhancement.
- [Fieldset](./components/fieldset.md), [IconButton](./components/icon-button.md), and
  [progress indicators](./components/progress.md) document the finite semantic replacements for
  grouped controls, icon-only native actions, and labelled progress states.
- [Display components](./components/display.md) document semantic tones, status behavior, native
  separators, safe Skeleton sizing, and explicit content composition in place of icon-name props.
- [Navigation](./components/navigation.md) and [overlays](./components/overlays.md) define owned
  triggers and panels, controlled state, keyboard and focus behavior, and the boundary around
  routers, teleportation, and application dismissal policy.
- [Advanced inputs](./components/advanced-inputs.md) preserve native Select and DatePicker
  submission while documenting localized clear actions and typed CommandPalette async content.
  [Table and DataTable](./components/data-tables.md) separates portable scalar controls from
  application-owned queries and rich table composition.
- [Layout primitives](./components/layout-primitives.md) replace the portable layout vocabulary;
  semantic landmarks, responsive shell state, routing, and theme bootstrap remain application-owned
  under the [shell decision](./architecture/application-shell-ownership.md).

The component guides name every `ui-runtime` controller required by server-rendered interactive
markup. Do not initialize those controllers over Vue-owned component trees.

`CmDataTable` now covers portable page-size controls and summaries, eligible-row selection, ordered
visible columns, and localizable interaction labels. Migrate rich cells and expanded content to an
application-owned `CmTable` composition; keep multi-sort and interactive column layout policy in
the application.

## Read-only checker

Run the migration checker against one or more source paths:

```bash
node scripts/check-vueforge-migration.mjs src
node scripts/check-vueforge-migration.mjs --format=json --allow-findings src templates
```

Text and JSON findings include file, line, column, reference kind, mapping action, and available
targets. Findings make the default command fail so it can guard a completed migration;
`--allow-findings` produces an inventory with exit code zero. Dependency and build directories are
ignored. The checker is read-only and rejects `--write`.

The checker never turns `compose`, `manual`, or `retain` entries into edits. Deterministic write mode
is implemented separately by `CMUI-152`.

## Deterministic codemod

Preview or apply the approved subset:

```bash
node scripts/migrate-to-codemonster-ui.mjs src
node scripts/migrate-to-codemonster-ui.mjs --write src
```

The codemod migrates named imports for direct component replacements, their TypeScript identifier
references, matching Vue component tags, and exact component CSS subpath imports. It can split a
mixed named import so manual APIs remain on VueForge. Aliased imports preserve the local alias.

Default imports, theme APIs and tokens, root stylesheets, props, slots, events, `compose` and
`manual` components, and retained packages are intentionally unchanged. Run the read-only checker
again after the codemod, review every remaining finding, format the edited files, and execute the
consumer's tests and visual/accessibility gates.
