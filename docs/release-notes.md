# VueForge August 2026 coordinated release notes

This release adds reusable admin workflow components, a shared responsive-query build contract,
Classic and Duotone icon families, and non-blocking TypeScript compilation for browser playgrounds.
All changes are backward-compatible within the current major package lines.

## Package versions

| Package                | Version | Published in this release |
| ---------------------- | ------: | :-----------------------: |
| Theme                  | `2.0.1` |            Yes            |
| Icons                  | `3.2.0` |            Yes            |
| Core                   | `2.4.0` |            Yes            |
| Layouts                | `2.1.2` |            Yes            |
| CodeBlock              | `4.0.1` |            No             |
| Playground Core        | `2.1.0` |            Yes            |
| Playground Vite Plugin | `1.0.0` |            No             |
| Playground             | `3.0.1` |            Yes            |

## Theme 2.0.1, Core 2.4.0, and Layouts 2.1.2

- Theme adds a canonical build-time registry and resolver for media and container-query aliases.
- Core adds `VfConfirmDialog`, `VfDataTableColumnChooser`, `VfFormLayout`, `VfGroupBox`, and
  `VfPageHeader`, plus a fully disabled `VfDropdown` state.
- Core adds four GroupBox color tokens. Complete custom `VfThemeTokens` presets must provide them;
  partial presets created with `extend` remain compatible.
- Core fixes horizontal Stepper connector seams.
- Core and Layouts now resolve responsive aliases from the Theme registry during development and
  production builds. Publish checks reject unresolved aliases.

## Icons 3.2.0

- Adds the `classic` and `duotone` families to all 109 system icons without changing the default
  Classic rendering.
- Adds the `family`, `secondaryColor`, and `secondaryOpacity` props and the public `iconFamilies`
  and `IconFamily` exports.
- Provides authored primary and secondary regions for Solid, Regular, Light, and Thin Duotone
  variants. The seven official brand marks remain Classic-only.
- Extends deterministic visual reference sheets to both families at 16, 20, 24, and 32 px.
- Simplifies the internal showcase to searchable Classic and Duotone variant catalogs.

Existing calls continue to select `classic`. Consumers can adopt Duotone incrementally without
changing icon names or package entry points.

## Playground Core 2.1.0 and Playground 3.0.1

- Playground Core moves TypeScript parsing and transpilation into a dedicated Web Worker.
- The roughly 1 MiB gzip compiler worker is downloaded only when a sandbox contains a `.ts` file or
  an inline `text/typescript` script.
- Component mode and JavaScript/HTML-only sandboxes continue to use the lightweight runtime and do
  not download the compiler.
- Playground 3.0.1 adopts the Playground Core 2.1 runtime and also resolves its responsive tab
  wrapping through the shared breakpoint registry.

The public session and Playground component APIs are unchanged.

## Upgrade

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-theme@^2.0.1 \
  @codemonster-ru/vueforge-icons@^3.2.0 \
  @codemonster-ru/vueforge-core@^2.4.0 \
  @codemonster-ru/vueforge-layouts@^2.1.2 \
  @codemonster-ru/vueforge-playground-core@^2.1.0 \
  @codemonster-ru/vueforge-playground@^3.0.1
```

CodeBlock `4.0.1` and Playground Vite Plugin `1.0.0` remain current and are not republished.

## Distribution and verification

The release gates cover package exports, CSS contracts, browser and server consumers, declarations,
tree shaking, deferred runtime budgets, deterministic icon snapshots, clean npm/pnpm/Yarn tarball
installs, documentation examples, and the complete test suite. Package-specific changes are recorded
in each package `CHANGELOG.md` and are used directly by the tag-driven release workflow.
