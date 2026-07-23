# VueForge Playground Core

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-playground-core)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-playground-core)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-playground-core)

A framework-agnostic runtime core for interactive playground sessions in the VueForge ecosystem.

Coordinated release: `@codemonster-ru/vueforge-playground-core@1.2.0`.

## Requirements

- Node.js 18 or newer for installation and build tooling.
- A browser iframe for the built-in browser runtime. Remote runtimes can provide their own executor.

## Install

```bash
npm install @codemonster-ru/vueforge-playground-core
```

```bash
pnpm add @codemonster-ru/vueforge-playground-core
```

```bash
yarn add @codemonster-ru/vueforge-playground-core
```

## Quick start

The package exposes one side-effect-free ESM entry and no CSS:

```html
<iframe id="playground-preview" title="Playground preview" sandbox="allow-scripts"></iframe>
```

```ts
import { createPlaygroundSession } from '@codemonster-ru/vueforge-playground-core';

const iframe = document.querySelector<HTMLIFrameElement>('#playground-preview');
if (!iframe) {
  throw new Error('Playground preview iframe is missing.');
}

const session = createPlaygroundSession({
  files: { '/index.ts': 'console.log("ready")' },
  entry: '/index.ts',
  iframe,
});

await session.run();
```

The browser runtime validates iframe messages and import resolution, and reports structured
runtime errors. Importing the module is SSR-safe, but executing the browser runtime requires DOM
APIs. Call `dispose()` when the host is removed.

TypeScript powers in-browser transpilation. Consumer bundlers therefore emit a compiler chunk of
about 1 MiB gzip; keep the runtime behind a dynamic import when it is not needed at startup. The
Vue Playground UI activates this runtime boundary only when a sandbox session is created.

## Package-local documentation

See
[src/index.ts](https://github.com/codemonster-ru/vueforge/blob/main/packages/playground-core/src/index.ts),
[src/types.ts](https://github.com/codemonster-ru/vueforge/blob/main/packages/playground-core/src/types.ts),
and
[CHANGELOG.md](https://github.com/codemonster-ru/vueforge/blob/main/packages/playground-core/CHANGELOG.md).
The higher-level Vue integration is documented in
[`@codemonster-ru/vueforge-playground`](https://github.com/codemonster-ru/vueforge/blob/main/packages/playground/README.md).

## License

[MIT](https://github.com/codemonster-ru/vueforge/blob/main/packages/playground-core/LICENSE)
