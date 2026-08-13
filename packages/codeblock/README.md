# VueForge CodeBlock

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-codeblock)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-codeblock)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-codeblock)

A Vue 3 code block component with syntax highlighting and token-based theming for VueForge.

Coordinated release: `@codemonster-ru/vueforge-codeblock@4.0.1`.

CodeBlock remains a dedicated VueForge composed product during the CodeMonster UI migration. It is
safe to use alongside the namespaced CodeMonster UI packages; there is no `ui-codeblock` or
`CmCodeBlock` replacement in the 1.0 scope. See the repository
[ownership decision](../../docs/architecture/codeblock-ownership.md) for the cross-platform review.

## Requirements

- Node.js 20 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.

## Install

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-codeblock
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-codeblock
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-codeblock
```

## Quick start

There is no root package export. Import the Vue component and plugin from `/view`:

```ts
import { createApp } from 'vue';
import VueForgeCodeBlock from '@codemonster-ru/vueforge-codeblock/view';

createApp({}).use(VueForgeCodeBlock);
```

The plugin already registers `VfCodeBlock`. Alternatively, import the named component from `/view`
for local registration, but do not register it again after installing the plugin.

The browser `/view` entry always loads standalone token, critical, and component CSS. Explicit CSS
entries are available for SSR client stylesheets and CSS-only use: import `tokens.css` before
`critical.css` or `codeblock.css`, or use `style.css` for the complete stylesheet. They do not turn
the public browser `/view` entry into a CSS-free import.

## Highlighting entry

```ts
import { highlightCodeBlock } from '@codemonster-ru/vueforge-codeblock/highlight';

const html = await highlightCodeBlock('typescript', 'const ready = true;');
```

Shiki core, its JavaScript engine, and language grammars are split into async chunks. A configured
language allowlist limits the grammar chunks requested at runtime; it does not remove emitted
dynamic chunks from a consumer build.

SSR can await highlighting through Vue server prefetch. Node ESM and CommonJS `/view` conditions
are CSS-free, so import `style.css` in the client stylesheet of an SSR application.

## More documentation

For full documentation, visit [docs.codemonster.net/vueforge/codeblock](https://docs.codemonster.net/vueforge/codeblock/).
See the repository
[installation guide](https://github.com/codemonster-ru/codemonster-ui/blob/main/docs/codeblock/installation.md)
and [CHANGELOG.md](https://github.com/codemonster-ru/codemonster-ui/blob/main/packages/codeblock/CHANGELOG.md).

## License

[MIT](https://github.com/codemonster-ru/codemonster-ui/blob/main/packages/codeblock/LICENSE)
