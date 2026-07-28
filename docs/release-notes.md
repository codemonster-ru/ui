# VueForge Core 2.3.0 release notes

VueForge Core 2.3.0 adds constrained, accessible, and persistable column resizing to `VfDataTable`.
This is a backward-compatible minor release.

## Current package versions

| Package                | Version | Published in this release |
| ---------------------- | ------: | :-----------------------: |
| Theme                  | `2.0.0` |            No             |
| Icons                  | `2.0.0` |            No             |
| Core                   | `2.3.0` |            Yes            |
| Layouts                | `2.1.1` |            No             |
| CodeBlock              | `4.0.0` |            No             |
| Playground Core        | `2.0.0` |            No             |
| Playground Vite Plugin | `1.0.0` |            No             |
| Playground             | `3.0.0` |            No             |

## Highlights

- Added pointer resizing from the boundary between adjacent `VfDataTable` columns.
- Added keyboard resizing with Left and Right Arrow and double-click content autosizing.
- Added controlled `columnWidths`, uncontrolled `defaultColumnWidths`, `update:columnWidths`, and
  `column-resize-end` contracts.
- Added `minWidth`, `maxWidth`, `nowrap`, and `resizable` column options.
- Added `dataTableColumnResizerColor` for theme-level resize boundary feedback.
- Added a resizable-column showcase with width reset and constrained-width examples.

## Compatibility

This release has no breaking API changes. Applications using the new Core APIs can upgrade Core
independently:

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-core@^2.3.0
```

Theme, Icons, Layouts, CodeBlock, Playground Core, Playground Vite Plugin, and Playground have no
runtime or public API changes in this work and are not republished.

## Data table resize behavior

- Resizing changes the two columns adjacent to the dragged boundary.
- The combined width of those columns and the overall table width remain fixed.
- The last column and a column followed by `resizable: false` do not expose a resize handle.
- `minWidth` and `maxWidth` constrain pointer, keyboard, and autosize operations.
- Controlled width records are serializable and can be persisted by applications.

## Package notes

- **Core 2.3.0:** adds constrained and persistable `VfDataTable` column resizing and its theme token.
- **Layouts 2.1.1:** unchanged from the previous release.

## Distribution and verification

The release gates cover:

- browser ESM, Node ESM, CommonJS, SSR, and declaration consumers;
- authoritative package exports and CSS entry points;
- component-subpath tree shaking and deferred runtime budgets;
- clean tarballs consumed through npm, pnpm, and Yarn;
- documentation imports, compiled examples, and generated fixtures;
- production and development dependency audits with zero known vulnerabilities;
- runtime, component, accessibility, theme-contract, and CSS-contract tests.

Package-specific changes are recorded in each package `CHANGELOG.md` and are used directly by the
tag-driven release workflow.
