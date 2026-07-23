# VueForge

VueForge is a Vue 3 ecosystem for design-system foundations, theming, accessible components,
layouts, icons, code presentation, and interactive playgrounds.

## Requirements

- Vue `^3.5.0`.
- Node.js 18 or newer for packages other than CodeBlock and Playground. A selected Vite version may
  impose a higher Node.js requirement on the Playground Vite plugin.
- Node.js 20 or newer when using CodeBlock or Playground.

## Install Core

Use the package manager that owns your application lockfile:

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-core@^1.36.0
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-core@^1.36.0
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-core@^1.36.0
```

## Quick start

Install the Core plugin once and import its complete stylesheet in the browser entry:

```ts
// src/main.ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';
import App from './App.vue';

createApp(App).use(VueForgeCore).mount('#app');
```

Wrap themed UI in `VfThemeProvider`. Components are not registered globally, so import the
components used by each application:

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { VfButton, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
</script>

<template>
  <VfThemeProvider default-theme="system">
    <main>
      <VfThemeSwitch label="Theme" />
      <VfButton>First VueForge action</VfButton>
    </main>
  </VfThemeProvider>
</template>
```

`VfThemeSwitch` persists the selected light or dark mode through the provider. Build the
application with its normal production command—for a standard Vite project:

```bash
npm run build
```

## Packages

| Package                                                       | Release  | Purpose                                    |
| ------------------------------------------------------------- | -------- | ------------------------------------------ |
| [`@codemonster-ru/vueforge-core`][npm-core]                   | `1.36.0` | Components, composables, theme integration |
| [`@codemonster-ru/vueforge-theme`][npm-theme]                 | `1.4.0`  | Framework-agnostic theme engine            |
| [`@codemonster-ru/vueforge-layouts`][npm-layouts]             | `1.22.0` | Layout primitives and application shells   |
| [`@codemonster-ru/vueforge-icons`][npm-icons]                 | `1.6.0`  | Vue icon renderer and catalog              |
| [`@codemonster-ru/vueforge-codeblock`][npm-codeblock]         | `3.7.0`  | Highlighted, themed code blocks            |
| [`@codemonster-ru/vueforge-playground`][npm-playground]       | `2.6.0`  | Vue playground UI adapter                  |
| [`@codemonster-ru/vueforge-playground-core`][npm-pg-core]     | `1.2.0`  | Framework-agnostic playground runtime      |
| [`@codemonster-ru/vueforge-playground-vite-plugin`][npm-vite] | `0.2.0`  | Vite playground virtual-module integration |

## Documentation

For full documentation, visit [docs.codemonster.net/vueforge](https://docs.codemonster.net/vueforge/).
Use the [migration guide](./docs/migration-guide.md) for the coordinated release train and the
[release notes](./docs/release-notes.md) for feature and compatibility details.

## License

VueForge packages are available under the [MIT License](./LICENSE).

[npm-codeblock]: https://www.npmjs.com/package/@codemonster-ru/vueforge-codeblock
[npm-core]: https://www.npmjs.com/package/@codemonster-ru/vueforge-core
[npm-icons]: https://www.npmjs.com/package/@codemonster-ru/vueforge-icons
[npm-layouts]: https://www.npmjs.com/package/@codemonster-ru/vueforge-layouts
[npm-pg-core]: https://www.npmjs.com/package/@codemonster-ru/vueforge-playground-core
[npm-playground]: https://www.npmjs.com/package/@codemonster-ru/vueforge-playground
[npm-theme]: https://www.npmjs.com/package/@codemonster-ru/vueforge-theme
[npm-vite]: https://www.npmjs.com/package/@codemonster-ru/vueforge-playground-vite-plugin
