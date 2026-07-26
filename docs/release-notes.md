# VueForge Core 2.2.0 release notes

VueForge Core 2.2.0 adds table selection and layout controls, reusable popup menus, and a refined
form-label theme token. This is a backward-compatible minor release.

## Current package versions

| Package                | Version | Published in this release |
| ---------------------- | ------: | :-----------------------: |
| Theme                  | `2.0.0` |            No             |
| Icons                  | `2.0.0` |            No             |
| Core                   | `2.2.0` |            Yes            |
| Layouts                | `2.1.1` |            No             |
| CodeBlock              | `4.0.0` |            No             |
| Playground Core        | `2.0.0` |            No             |
| Playground Vite Plugin | `1.0.0` |            No             |
| Playground             | `3.0.0` |            No             |

## Highlights

- Added `VfMenu` and `VfMenuItem` for icon-supported vertical menus inside `VfDropdown` and other
  popup containers.
- Added controlled and uncontrolled row selection to `VfDataTable`, including select-all and
  indeterminate header states for bulk actions.
- Added `VfDataTableColumn.width` and `verticalAlign` support.
- Added `VfCheckbox.indeterminate` with native mixed-selection semantics.
- Added the `fieldLabelFontSize` theme token and changed default form field labels to `1rem`.
- Improved data table header/stripe contrast and pagination vertical spacing.

## Compatibility

This release has no breaking API changes. Applications using the new Core APIs can upgrade Core
independently:

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-core@^2.2.0
```

Theme, Icons, Layouts, CodeBlock, Playground Core, Playground Vite Plugin, and Playground have no
runtime or public API changes in this work and are not republished.

## New Core theme token

- `--vf-field-label-font-size` controls the size of standard and resting floating field labels.

## Package notes

- **Core 2.2.0:** adds `VfMenu`, `VfMenuItem`, data table selection and column controls, the
  indeterminate checkbox state, and the field label typography token.
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
