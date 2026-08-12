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

## Direct component replacements

The following names have one implemented `ui-vue` target. Their props and composition still require
contract review before an import/name codemod is applied.

| VueForge           | CodeMonster UI     | VueForge      | CodeMonster UI |
| ------------------ | ------------------ | ------------- | -------------- |
| `VfAccordion`      | `CmAccordion`      | `VfAlert`     | `CmAlert`      |
| `VfAvatar`         | `CmAvatar`         | `VfBadge`     | `CmBadge`      |
| `VfBreadcrumbs`    | `CmBreadcrumbs`    | `VfButton`    | `CmButton`     |
| `VfCard`           | `CmCard`           | `VfCheckbox`  | `CmCheckbox`   |
| `VfCommandPalette` | `CmCommandPalette` | `VfDataTable` | `CmDataTable`  |
| `VfDatePicker`     | `CmDatePicker`     | `VfDialog`    | `CmDialog`     |
| `VfDivider`        | `CmDivider`        | `VfDrawer`    | `CmDrawer`     |
| `VfDropdown`       | `CmDropdown`       | `VfField`     | `CmField`      |
| `VfInput`          | `CmInput`          | `VfLink`      | `CmLink`       |
| `VfMenu`           | `CmMenu`           | `VfPopover`   | `CmPopover`    |
| `VfRadio`          | `CmRadio`          | `VfSelect`    | `CmSelect`     |
| `VfSkeleton`       | `CmSkeleton`       | `VfSwitch`    | `CmSwitch`     |
| `VfTable`          | `CmTable`          | `VfTabs`      | `CmTabs`       |
| `VfTextarea`       | `CmTextarea`       | `VfTooltip`   | `CmTooltip`    |
| `VfContainer`      | `CmContainer`      | `VfStack`     | `CmStack`      |
| `VfInline`         | `CmInline`         | `VfSection`   | `CmSection`    |
| `VfGrid`           | `CmGrid`           |               |                |

## Composition and manual review

`VfConfirmDialog`, `VfFieldset`, `VfFormLayout`, `VfGroupBox`, `VfIconButton`, `VfPanel`,
`VfPageHeader`, `VfSkeletonGate`, `VfAuthLayout`, and `VfErrorLayout` become application compositions
of the targets listed in the machine map.

DataTable column choice, menu-bar and nav-menu policy, progress, Stepper, Table of Contents, Tag,
ThemeSwitch, all application shells, SetupLayout, and standalone shell areas require manual review.
They have no direct stable component replacement. Native HTML and the listed CodeMonster UI
primitives are preferred where sufficient.

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
