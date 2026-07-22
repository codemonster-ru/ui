# VueForge Core

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-core)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-core)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-core)

Core Vue 3 components, tokens, and theme runtime for the VueForge ecosystem.

## Requirements

- Node.js 18 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.

## Install

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-core
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-core
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-core
```

## Full setup

The plugin applies the default theme and provides configuration. It does not globally register
components.

```ts
import { createApp } from 'vue';
import VueForgeCore, { VfButton } from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

const app = createApp({});
app.use(VueForgeCore);
app.component('VfButton', VfButton);
```

## Granular setup

Component subpaths load their matching component CSS in browser builds:

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import { VfButton } from '@codemonster-ru/vueforge-core/button';
import '@codemonster-ru/vueforge-core/tokens.css';
import '@codemonster-ru/vueforge-core/theme.css';
import '@codemonster-ru/vueforge-core/base.css';

createApp({}).use(VueForgeCore);
```

Auto CSS covers component rules; it does not silently import the complete baseline. Use the three
foundation CSS entries above once per application. `styles.css` is the full stylesheet and includes
every component rule, so it is not a granular alternative to those entries.

For fully manual CSS delivery, import components from the CSS-free package root and add the matching
component CSS explicitly. Browser component subpaths always select their auto-CSS wrappers.

```ts
import VueForgeCore, { VfButton } from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/tokens.css';
import '@codemonster-ru/vueforge-core/theme.css';
import '@codemonster-ru/vueforge-core/base.css';
import '@codemonster-ru/vueforge-core/button.css';
```

## Public entries

- Root: plugin, components, composables, theme helpers, and public types.
- Components: `./button`, `./dialog`, `./tabs`, and the other documented component subpaths.
- Runtime utilities: `./foundation`, `./theme`, and `./async`.
- CSS: `./styles.css`, `./foundation.css`, `./tokens.css`, `./theme.css`, `./base.css`, and
  per-component CSS entries.

The root, foundation, and theme entries support ESM and CommonJS SSR. Node ESM component
conditions are CSS-free; browser conditions retain component auto CSS. Import application CSS in
the client entry of an SSR application.

## More documentation

For full documentation, visit [docs.codemonster.net/vueforge/core](https://docs.codemonster.net/vueforge/core/).
Start with the repository
[installation guide](https://github.com/codemonster-ru/vueforge/blob/main/docs/core/installation.md)
and [CHANGELOG.md](https://github.com/codemonster-ru/vueforge/blob/main/packages/core/CHANGELOG.md).
