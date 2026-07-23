# VueForge Playground

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-playground)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-playground)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-playground)

A Vue 3 UI adapter for running interactive code playground sessions in the VueForge ecosystem.

Coordinated release: `@codemonster-ru/vueforge-playground@3.0.0`.

## Requirements

- Node.js 20 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.
- A direct `@codemonster-ru/vueforge-core` dependency for application theme and baseline CSS setup.

## Install

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-core@^2.0.0 @codemonster-ru/vueforge-playground
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-core@^2.0.0 @codemonster-ru/vueforge-playground
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-core@^2.0.0 @codemonster-ru/vueforge-playground
```

## Quick start

There is no root Playground export. Import the UI plugin from `/ui` and install it explicitly:

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';
import { VfPlaygroundPlugin } from '@codemonster-ru/vueforge-playground/ui';

const app = createApp({});
app.use(VueForgeCore);
app.use(VfPlaygroundPlugin);
```

The browser `/ui` entry always loads Playground CSS. Explicit entries (`style.css`, `tokens.css`,
`critical.css`, and `playground.css`) are for SSR client stylesheets and CSS-only use; they do not
disable the public browser `/ui` auto-CSS wrapper. Load `tokens.css` first when composing granular
CSS entries.

## Lazy UI

```ts
import { VfPlaygroundAsync } from '@codemonster-ru/vueforge-playground/ui';
```

`VfPlaygroundAsync` provides async rendering and a skeleton fallback. Because `/ui` also exports the
synchronous component and plugin, importing this wrapper from `/ui` does not guarantee a separate UI
bundle. Dynamically import the entire `/ui` entry at a route or component boundary when bundle-level
UI deferral is required.

The sandbox runtime and TypeScript compiler remain deferred until a browser session is created.
Component mode does not download the compiler; sandbox activation currently adds a compiler chunk
of about 1 MiB gzip.

Use `/runtime` only when creating sessions directly:

```ts
import { createPlaygroundSession } from '@codemonster-ru/vueforge-playground/runtime';
```

The package is ESM-only. SSR keeps the first render deterministic and delays iframe/session work
until mount. Node ESM `/ui` is CSS-free; import Core and Playground styles from the client entry.

## More documentation

For full documentation, visit [docs.codemonster.net/vueforge/playground](https://docs.codemonster.net/vueforge/playground/).
See the repository
[installation guide](https://github.com/codemonster-ru/vueforge/blob/main/docs/playground/installation.md)
and [CHANGELOG.md](https://github.com/codemonster-ru/vueforge/blob/main/packages/playground/CHANGELOG.md).

## License

[MIT](https://github.com/codemonster-ru/vueforge/blob/main/packages/playground/LICENSE)
