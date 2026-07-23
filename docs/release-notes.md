# VueForge 2 coordinated release notes

VueForge 2 removes the compatibility paths left behind by the completed token and theme
architecture migration. The built-in visual design, OKLCH palette, accessibility behavior,
component set, documented custom-prefix support, and supported CommonJS entries are unchanged.

## Package versions

| Package                | Version |
| ---------------------- | ------: |
| Theme                  | `2.0.0` |
| Icons                  | `2.0.0` |
| Core                   | `2.0.0` |
| Layouts                | `2.0.0` |
| CodeBlock              | `4.0.0` |
| Playground Core        | `2.0.0` |
| Playground Vite Plugin | `1.0.0` |
| Playground             | `3.0.0` |

## Highlights

- Primitive and semantic tokens are the only color contract; the 35 legacy color roots are gone.
- `data-vf-theme` is the only implicit theme attribute. Explicitly configured custom attributes
  and prefixes remain supported.
- Complete presets now require the complete built-in token contract, while mode and extension
  overrides remain partial.
- Package `exports` is authoritative. Supported ESM, CommonJS, Node, browser, declaration, and CSS
  conditions remain available.
- Deprecated type aliases, unused constants, inert component props, dead runtime branches, and
  unused CSS hooks were removed.
- Grouped Core CSS manifests that only forwarded imports were replaced by direct canonical entry
  imports.
- A read-only migration checker with an opt-in write mode is included.

## Breaking changes

- Legacy token roots such as `colorBg`, `colorPrimary`, and `colorSuccessSoft` were replaced by
  primitive or semantic tokens.
- The implicit `data-theme` selector and runtime observation path were removed.
- Complete `VfThemeTokens` presets can no longer omit built-in fields.
- Four deprecated `VueforgePlayground*` type aliases were removed in favor of the existing
  `VueForgePlayground*` names.
- `SHIKI_LIGHT_THEME` and `SHIKI_DARK_THEME` were removed from CodeBlock.
- The inert `style="solid"` prop was removed from `VueIconify`.
- The empty `dualStyleCoreIconNames` export and unused regular-variant generator path were removed.
- Unused component hooks, including generic `shadow`, button filter hooks, and retired Playground
  control variables, were removed.
- Top-level `main`, `module`, and `types` resolver metadata was removed from package manifests.
  Consumers must use package `exports`.
- CodeBlock and Playground continue to require their documented `/view`, `/highlight`, `/ui`, and
  `/runtime` subpaths instead of package-root JavaScript imports.

See [Migrating to VueForge 2](./migration-to-v2.md) for the complete old-to-new mapping and the
migration checker.

## Preserved behavior

- Default light and dark OKLCH values and rendered component design.
- Existing component, slot, emit, and accessibility contracts that were not deprecated.
- Explicit custom theme attributes and custom token prefixes.
- Explicit CodeBlock theme props and Playground class-based theme selection.
- CommonJS for packages that advertise a `require` export condition.
- CSS-free Node/SSR paths and explicit browser CSS exports.
- Component subpaths and current tree-shaking boundaries.

## Package notes

- **Theme:** exposes only the canonical attribute and serialization path.
- **Icons:** removes the inert icon-style prop while preserving catalog style metadata.
- **Core:** removes legacy token roots, no-op hooks, and forwarding-only CSS manifests.
- **Layouts:** removes an unexported composable and obsolete token defaults.
- **CodeBlock:** removes unused Shiki exports, fallback branches, and dead styling hooks.
- **Playground Core:** collapses an identical runtime branch.
- **Playground Vite Plugin:** removes deprecated type spellings.
- **Playground:** removes retired variables and the implicit `data-theme` path.

## Distribution and verification

The release gates cover:

- browser ESM, Node ESM, CommonJS, SSR, and declaration consumers;
- authoritative package exports and CSS entry points;
- component-subpath tree shaking and deferred runtime budgets;
- clean tarballs consumed through npm, pnpm, and Yarn;
- documentation imports, compiled examples, and generated fixtures;
- runtime, component, accessibility, and theme-contract tests.

Measured before-and-after artifacts and the complete cleanup inventory are recorded in the
[VueForge 2 cleanup report](./design-audit/vueforge-2-cleanup-report.md).

## Recommended installation

Upgrade interdependent packages together. A full Core and Layouts setup starts with:

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-core@^2.0.0 \
  @codemonster-ru/vueforge-layouts@^2.0.0
```

Import CSS from the browser/client entry used by the application:

```ts
import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-core/styles.css';
import '@codemonster-ru/vueforge-layouts/styles.css';

createApp({}).use(VueForgeLayouts);
```

Copy-ready project, GitHub Release, npm description, and announcement text is available in
[public-release-assets.md](./public-release-assets.md).
