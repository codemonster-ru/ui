# VueForge release-train migration guide

This guide covers the coordinated releases produced by design-system Phases 0–3 and the Phase 4
packaging audit. Phase 4 removes no documented public export or design token.

## Coordinated versions

Keep the packages on compatible floors when upgrading only part of the ecosystem.

| Package                                           | Release  | Required runtime and internal floors                                                       |
| ------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `@codemonster-ru/vueforge-theme`                  | `1.4.0`  | Node.js `>=18`                                                                             |
| `@codemonster-ru/vueforge-icons`                  | `1.6.0`  | Vue `^3.5.0`, Node.js `>=18`                                                               |
| `@codemonster-ru/vueforge-core`                   | `1.36.0` | Theme `^1.4.0`, Icons `^1.6.0`, Vue `^3.5.0`, Node.js `>=18`                               |
| `@codemonster-ru/vueforge-layouts`                | `1.22.0` | Core `^1.36.0`, Theme `^1.4.0`, Vue `^3.5.0`, Node.js `>=18`                               |
| `@codemonster-ru/vueforge-codeblock`              | `3.7.0`  | Icons `^1.6.0`, Vue `^3.5.0`, Node.js `>=20`                                               |
| `@codemonster-ru/vueforge-playground-core`        | `1.2.0`  | TypeScript `^5.8.2`, Node.js `>=18`                                                        |
| `@codemonster-ru/vueforge-playground-vite-plugin` | `0.2.0`  | Vite `^6`, `^7`, or `^8`; Node.js `>=18`                                                   |
| `@codemonster-ru/vueforge-playground`             | `2.6.0`  | Core `^1.36.0`, CodeBlock `^3.7.0`, Playground Core `^1.2.0`, Vue `^3.5.0`, Node.js `>=20` |

The repository release toolchain itself uses Node.js 24 and npm 11.9. Consumer engine floors are
the package-specific values in the table.

## Upgrade packages together

For an application using the full Vue integration:

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-theme@^1.4.0 \
  @codemonster-ru/vueforge-icons@^1.6.0 \
  @codemonster-ru/vueforge-core@^1.36.0 \
  @codemonster-ru/vueforge-layouts@^1.22.0 \
  @codemonster-ru/vueforge-codeblock@^3.7.0 \
  @codemonster-ru/vueforge-playground-core@^1.2.0 \
  @codemonster-ru/vueforge-playground@^2.6.0
```

Use the equivalent `pnpm add` or `yarn add` command if that package manager owns the application
lockfile. Do not mix package managers in one checkout.

## Vue 3.5 is required

Core, Layouts, Icons, CodeBlock, and Playground now declare Vue `^3.5.0`. Core uses Vue's
request-stable `useId` contract for SSR and hydration. Upgrade Vue and `@vue/server-renderer`
together before upgrading these packages.

## Use the published JavaScript entries

CodeBlock and Playground do not expose package-root JavaScript entries through modern `exports`:

```ts
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
import { highlightCodeBlock } from '@codemonster-ru/vueforge-codeblock/highlight';

import { VfPlaygroundPlugin } from '@codemonster-ru/vueforge-playground/ui';
import { createPlaygroundSession } from '@codemonster-ru/vueforge-playground/runtime';
```

These explicit entries were introduced in CodeBlock 3.0 and Playground 2.0. Legacy
`main`/`module`/`types` metadata remains so old resolvers are not broken by this minor release, but
applications should replace root imports because modern Node, bundlers, and TypeScript honor
`exports`.

Core and Layouts still support root imports. Their component subpaths are preferred when an
application wants component-level browser CSS and smaller bundles.

## Understand browser and Node CSS conditions

Browser ESM component entries retain automatic CSS:

- Core and Layouts component subpaths;
- Icons root;
- CodeBlock `/view`;
- Playground `/ui`.

Node ESM conditions and CommonJS entries are intentionally CSS-free. Import CSS from the client
entry of an SSR application. Full application setup commonly uses:

```ts
import '@codemonster-ru/vueforge-core/styles.css';
import '@codemonster-ru/vueforge-layouts/styles.css';
import '@codemonster-ru/vueforge-codeblock/style.css';
import '@codemonster-ru/vueforge-playground/style.css';
```

Use only the packages present in the application. Component subpaths can replace full stylesheets;
Core tokens, theme, and base styles still need to be provided once.

### Icons CommonJS correction

Icons CommonJS previously reached a browser-oriented artifact that injected CSS through DOM APIs.
That made SSR `require()` depend on a fake `document`. Version 1.6 corrects this defect: Node ESM and
CommonJS return the icon API without touching CSS or the DOM.

If a client bundle consumes the CommonJS/Node path, add:

```ts
import '@codemonster-ru/vueforge-icons/style.css';
```

This is a server-safety correction, not removal of a documented component API. Standard browser ESM
imports continue to load icon CSS automatically.

## Theme and token compatibility

No public design token was removed or renamed in this release train. Legacy public token aliases
remain available. Phase 0 removed malformed custom-property spellings that existed only because the
old static serializer disagreed with runtime output; use the canonical names generated by the public
token keys rather than relying on those accidental spellings.

Phase 2 changes the default color values to the accessible OKLCH palette. Custom presets and CSS
overrides continue to use the same public names. Phase 4 does not change palette values.

Scoped Core, CodeBlock, and Playground themes now resolve the nearest valid light/dark boundary and
can reverse an outer theme. Remove workarounds that copied root theme variables into nested scopes;
keeping them can override the corrected local scope.

## Behavior corrections to verify

- Nested overlays now use one topmost Escape/focus owner and reference-counted scroll locking.
- `VfAppShell` controlled sidebar state no longer mutates locally or emits during initial render.
- Disabled Select options are skipped by keyboard navigation.
- CodeBlock preserves server-highlighted markup during hydration.
- Playground rejects unrelated iframe messages, bounds console history, and reports circular imports.
- Reduced-motion and forced-colors rules are present in full and component CSS.

These are corrections of intended behavior. Re-run application tests if existing code depended on a
previous defect.

## Verify an upgraded application

1. Remove the package manager's install directory and perform a clean install.
2. Run TypeScript with the application's normal module resolution mode.
3. Build the browser bundle and inspect CSS imports and chunk warnings.
4. Render the application through its real SSR entry without DOM shims.
5. Exercise light/dark scoped themes, keyboard overlays, CodeBlock, and Playground.
6. Confirm the lockfile resolves the coordinated floors from the version table.

Release highlights and known payload caveats are summarized in [release-notes.md](./release-notes.md).
