# VueForge Playground Vite Plugin

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-playground-vite-plugin)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-playground-vite-plugin)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-playground-vite-plugin)

A Vite plugin for resolving VueForge playground virtual modules from local source files.

Coordinated release: `@codemonster-ru/vueforge-playground-vite-plugin@1.0.0`.

This plugin remains build tooling for the dedicated VueForge Playground product family; it is not
part of the CodeMonster UI package graph. See the repository
[ownership decision](../../docs/architecture/playground-ownership.md) for the reviewed boundary.

## Requirements

- Node.js 18 or newer for the plugin itself. The selected Vite major may require a newer Node.js
  version.
- Vite `^6.0.0`, `^7.0.0`, or `^8.0.0`.

## Install

```bash
npm install --save-dev @codemonster-ru/vueforge-playground-vite-plugin
```

```bash
pnpm add --save-dev @codemonster-ru/vueforge-playground-vite-plugin
```

```bash
yarn add --dev @codemonster-ru/vueforge-playground-vite-plugin
```

## Quick start

```ts
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { vueforgePlaygroundVirtualPlugin } from '@codemonster-ru/vueforge-playground-vite-plugin';

export default defineConfig({
  plugins: [
    vueforgePlaygroundVirtualPlugin({
      entries: {
        example: fileURLToPath(new URL('./src/examples/example.ts', import.meta.url)),
      },
    }),
  ],
});
```

Consumer code can then import `virtual:vueforge-playground/example`. Entries support default,
namespace, and named export modes. The package is side-effect free, ESM-only, and does not ship
browser runtime code or CSS.

The plugin executes in Vite's Node process and is safe to use for both client and SSR builds. It
does not need Vue at runtime; the files exposed through virtual modules define their own runtime
dependencies.

Public option types use the `VueForge*` prefix.

## Package-local documentation

See
[src/index.ts](https://github.com/codemonster-ru/ui/blob/main/packages/playground-vite-plugin/src/index.ts)
and
[CHANGELOG.md](https://github.com/codemonster-ru/ui/blob/main/packages/playground-vite-plugin/CHANGELOG.md).
Playground UI and runtime setup is documented in
[`@codemonster-ru/vueforge-playground`](https://github.com/codemonster-ru/ui/blob/main/packages/playground/README.md).

## License

[MIT](https://github.com/codemonster-ru/ui/blob/main/packages/playground-vite-plugin/LICENSE)
