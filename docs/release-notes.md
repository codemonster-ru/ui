# VueForge Icons 3.0.0 and Core 2.3.0 release notes

This coordinated release completes the VueForge Icons outline migration, adds the public
`VfDatePicker`, and completes the current `VfDataTable` interaction set. CodeBlock receives a patch
release so consumers can resolve either Icons 2.x or 3.x without a nested legacy icon package.

## Current package versions

| Package                | Version | Published in this release |
| ---------------------- | ------: | :-----------------------: |
| Theme                  | `2.0.0` |            No             |
| Icons                  | `3.0.0` |            Yes            |
| Core                   | `2.3.0` |            Yes            |
| Layouts                | `2.1.1` |            No             |
| CodeBlock              | `4.0.1` |            Yes            |
| Playground Core        | `2.0.0` |            No             |
| Playground Vite Plugin | `1.0.0` |            No             |
| Playground             | `3.0.0` |            No             |

## Icons 3.0.0

- Migrated all 109 VueForge product icons to the approved 24-unit outline language with a canonical
  2-unit round stroke.
- Preserved the seven independent GitHub, Telegram, VK, X, YouTube, Facebook, and Instagram brand
  marks as solid trademark geometry.
- Added owner-approved migration baselines, family review records, visual auditing, and review
  showcase modes.
- Expanded `IconCatalogEntry.style` from `'solid'` to `'solid' | 'outline'`.
- Kept every public icon name unchanged.

This is a visual and metadata major release. Consumers that exhaustively handle catalog styles must
support `outline`; rendered snapshots change for the 109 non-brand icons.

## Core 2.3.0

### Date Picker

- Added `VfDatePicker` through the package root, `./date-picker`, and `./date-picker.css` exports.
- Added date, month, year, time, multiple-selection, and range modes with stable ISO-like values.
- Added localization, fixed display patterns, configurable week starts, min/max constraints,
  clearable state, native form values, floating labels, and keyboard-accessible grid navigation.

### Data Table

- Added controlled visibility, pointer/keyboard column reordering, start/end pinned columns, and
  constrained pointer/keyboard resizing with content autosizing.
- Added client/manual sorting, optional multi-sort, expandable rows, per-row selection eligibility,
  localized labels, an error state, and responsive numbered pagination.
- Added persistable controlled/uncontrolled order and width state plus the corresponding public
  types and events.
- Added `dataTableErrorColor` and `dataTableColumnResizerColor` theme tokens and unified table
  surface styling.

Core 2.3.0 is backward-compatible. It accepts both Icons 2.x and 3.x; install Icons 3 to use the new
outline geometry throughout Core components.

## CodeBlock 4.0.1

- Declares compatibility with both Icons 2.x and 3.x.
- Uses the current Vue declaration processor after the build-tool upgrade.

## Upgrade

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-icons@^3.0.0 \
  @codemonster-ru/vueforge-core@^2.3.0 \
  @codemonster-ru/vueforge-codeblock@^4.0.1
```

Theme, Layouts, Playground Core, Playground Vite Plugin, and Playground have no unreleased runtime
or public API changes and are not republished.

## Distribution and verification

The release gates cover:

- browser ESM, Node ESM, CommonJS, SSR, and declaration consumers;
- authoritative package exports and CSS entry points;
- component-subpath tree shaking and deferred runtime budgets;
- clean tarballs consumed through npm, pnpm, and Yarn;
- documentation imports, compiled examples, and generated fixtures;
- production and development dependency audits with zero known vulnerabilities;
- runtime, component, accessibility, theme-contract, icon-audit, and CSS-contract tests.

Package-specific changes are recorded in each package `CHANGELOG.md` and are used directly by the
tag-driven release workflow.
