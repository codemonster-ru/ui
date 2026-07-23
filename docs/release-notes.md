# VueForge coordinated release notes

This release train packages the completed theme-contract, semantic-token, accessible color, and
design-system readiness work for public distribution.

## Package versions

| Package                |  Version |
| ---------------------- | -------: |
| Theme                  |  `1.4.0` |
| Icons                  |  `1.6.0` |
| Core                   | `1.36.0` |
| Layouts                | `1.22.0` |
| CodeBlock              |  `3.7.0` |
| Playground Core        |  `1.2.0` |
| Playground Vite Plugin |  `0.2.0` |
| Playground             |  `2.6.0` |

## Highlights

- One canonical TypeScript/runtime/static CSS token contract across Theme, Core, and Layouts.
- Primitive and semantic color architecture with an accessible OKLCH default palette.
- Matching full, component-entry, fallback, runtime, and scoped-theme behavior.
- Request-stable SSR IDs and deterministic ThemeProvider, CodeBlock, and Playground hydration.
- Coordinated nested overlays, focus traps, Escape ownership, and scroll locking.
- Improved ARIA, keyboard, RTL, reduced-motion, forced-colors, touch, and 400% zoom behavior.
- Correct ESM/CommonJS/type/CSS package conditions, clean tarball builds, and packed consumer gates.
- Secure Playground iframe transport, bounded logs, circular-import diagnostics, and deferred runtime.

## Package and distribution fixes

- Browser component entries retain automatic CSS, while Node ESM and CommonJS paths avoid server-side
  CSS or DOM evaluation.
- Icons CommonJS no longer uses the old DOM-injecting UMD path. Explicit `style.css` remains available
  for client bundles.
- Core and Layouts CommonJS entries have matching CommonJS declaration facades.
- Core and Layouts component subpaths expose declarations for the actual selected component.
- Internal dependency floors are coordinated so a clean registry install cannot resolve an older,
  incompatible VueForge package.
- Theme, Playground Core, and the Playground Vite plugin are explicitly side-effect free.
- Package builds and publication checks start from clean artifacts rather than stale workspace `dist`.
- Icons declares its Sass build compiler directly instead of relying on a transitive development
  dependency.

## Documentation and onboarding

- Root and package READMEs now provide consistent requirements, npm/pnpm/Yarn installation, quick
  starts, public imports, documentation links, release versions, and license information.
- Canonical guides cover runtime and scoped themes, custom prefixes, static fallbacks,
  accessibility, Vue/Vite SSR, Nuxt, hydration, Teleports, CodeBlock, and Playground.
- Component API tables and runnable examples are checked against public exports, SFC contracts, Vue
  compilation, and built TypeScript declarations during `verify`.
- Documentation fixtures reject path traversal before writing generated files, so untrusted pull
  request Markdown cannot escape the isolated example workspace.
- Playground now honors the existing `componentSourceLanguage` prop for single-source and
  extensionless component examples.
- The production showcase declares its existing SVG favicon and completes clean-profile Chromium
  smoke tests without console or network errors.

## Breaking changes

There are no removed or renamed exports, props, events, or public design tokens in this release train.

Compatibility requirements and corrected behavior still require attention:

- Vue 3.5 is the minimum for all Vue packages.
- CodeBlock uses `/view` and `/highlight`; Playground uses `/ui` and `/runtime`. Neither has a modern
  root JS export; legacy resolver metadata remains for compatibility.
- Node ESM and CommonJS imports are CSS-free. Import package CSS in the browser/client entry.
- Icons CommonJS no longer injects CSS through the DOM. This is a correction of unintended SSR
  behavior; add the explicit `style.css` client import when needed.
- Phase 2 changes default color values to OKLCH, but preserves public token names.

See the [migration guide](./migration-guide.md) for exact package floors and examples.

## Bundle and lazy-loading notes

The Phase 4 production audit measured minified outputs with gzip reported separately. Values are
snapshots for regression review, not permanent public size guarantees.

| Scenario                                             |                           Audited payload | Interpretation                                                           |
| ---------------------------------------------------- | ----------------------------------------: | ------------------------------------------------------------------------ |
| Core `button` component subpath, including CSS       |                           `2.65 KiB` gzip | Entry JS and button CSS; Vue and Core shared foundation excluded         |
| Layouts `container` component subpath, including CSS |                           `0.70 KiB` gzip | Entry JS and container CSS; Vue and Core/Layouts foundations excluded    |
| Generic Icons renderer                               |                          `24.18 KiB` gzip | Includes the dynamic-name icon component catalog; Vue external           |
| CodeBlock `/view` initial entry                      |                           `4.42 KiB` gzip | Icons and Vue external; Shiki remains deferred                           |
| All emitted CodeBlock Shiki chunks                   |                   about `174.81 KiB` gzip | Only core/engine and requested grammars are downloaded at runtime        |
| Playground `/ui` initial entry                       |                           `4.25 KiB` gzip | Shared VueForge dependencies external; sandbox runtime/compiler deferred |
| Playground TypeScript compiler chunk                 | `3.61 MB` minified / about `1.03 MB` gzip | Loaded only when a browser sandbox session is activated                  |
| Showcase initial application entry                   |                          `90.24 KiB` gzip | Passes the repository `95 KiB` initial-entry budget                      |

Vite still reports the optional TypeScript compiler chunk as larger than 500 kB. Manual chunking
cannot make the compiler smaller, and raising the global warning threshold would hide unrelated
regressions. The release gates instead assert that TypeScript, Playground runtime, and Shiki do not
enter the initial static graph.

## Recommended installation

Install only the packages used by the application. A full Core and Layouts setup is:

```ts
import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-core/styles.css';
import '@codemonster-ru/vueforge-layouts/styles.css';

createApp({}).use(VueForgeLayouts);
```

The Layouts plugin installs the Core theme plugin, so installing both plugins would apply Core twice.
Use component subpaths when granular browser CSS and smaller bundles are preferred, and import the
Core and Layouts shared token/theme/base entries once. For fully manual CSS, use named imports from
the CSS-free package roots plus explicit component CSS. For SSR, keep CSS imports in the client entry
and exercise the CSS-free Node paths in the server build.

Copy-ready project, GitHub Release, npm description, and announcement text is available in
[public-release-assets.md](./public-release-assets.md).
