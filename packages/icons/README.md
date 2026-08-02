# VueForge Icons

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-icons)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-icons)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-icons)

A lightweight Vue 3 icon library with a unified API for the VueForge ecosystem.

Coordinated release: `@codemonster-ru/vueforge-icons@3.0.0`.

## Requirements

- Node.js 18 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.

## Install

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-icons
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-icons
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-icons
```

## Quick start

```vue
<script setup lang="ts">
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
</script>

<template>
  <VueIconify :icon="icons.check" aria-hidden="true" />
</template>
```

The root entry exports `VueIconify`, icon names, catalog metadata, and related TypeScript types.
Browser ESM imports automatically load the small component stylesheet. The explicit CSS entry is:

```ts
import '@codemonster-ru/vueforge-icons/style.css';
```

Node ESM and CommonJS conditions are DOM-free and deliberately do not inject CSS. Import
`style.css` from the client stylesheet or browser entry of an SSR application. The CommonJS API
is available through `require('@codemonster-ru/vueforge-icons')`.

The package also retains `dist/index.ts.umd.js` for direct CDN consumers that provide the global
`Vue` runtime. It is a standalone distribution artifact, not a package `exports` subpath.

`VueIconify` accepts icon names dynamically, so the generic renderer includes the icon component
catalog. Metadata-only named imports remain tree-shakeable.

## Visual styles

The catalog contains 109 approved VueForge outline icons and seven independent solid brand marks.
The `style` catalog field describes each icon's geometry; it does not select a runtime variant.
Brand marks retain their official geometry and remain subject to their owners' trademark guidance.

## More documentation

For full documentation, visit [docs.codemonster.net/vueforge/icons](https://docs.codemonster.net/vueforge/icons/).
See
[src/lib/index.ts](https://github.com/codemonster-ru/vueforge/blob/main/packages/icons/src/lib/index.ts)
and [CHANGELOG.md](https://github.com/codemonster-ru/vueforge/blob/main/packages/icons/CHANGELOG.md)
for the package-local public contract and release history.

## License

[MIT](https://github.com/codemonster-ru/vueforge/blob/main/packages/icons/LICENSE)
