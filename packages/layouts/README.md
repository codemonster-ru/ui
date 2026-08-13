# VueForge Layouts

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-layouts)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-layouts)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-layouts)

Responsive layout primitives and application shells for VueForge-based Vue 3 applications.

Coordinated release: `@codemonster-ru/vueforge-layouts@2.1.2`.

## Requirements

- Node.js 18 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.
- `@codemonster-ru/vueforge-core` `^2.1.0`.

## Install

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-core@^2.1.0 @codemonster-ru/vueforge-layouts
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-core@^2.1.0 @codemonster-ru/vueforge-layouts
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-core@^2.1.0 @codemonster-ru/vueforge-layouts
```

## Quick start

```ts
import { createApp } from 'vue';
import VueForgeLayouts, { VfAppShell } from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-core/styles.css';
import '@codemonster-ru/vueforge-layouts/styles.css';

const app = createApp({});
app.use(VueForgeLayouts);
app.component('VfAppShell', VfAppShell);
```

The Layouts plugin installs the Core theme plugin and applies layout theme configuration. It does
not globally register layout components.

## Granular setup

```ts
import '@codemonster-ru/vueforge-core/tokens.css';
import '@codemonster-ru/vueforge-core/theme.css';
import '@codemonster-ru/vueforge-core/base.css';
import '@codemonster-ru/vueforge-layouts/tokens.css';
import '@codemonster-ru/vueforge-layouts/theme.css';
import '@codemonster-ru/vueforge-layouts/base.css';
import VfAppShell from '@codemonster-ru/vueforge-layouts/app-shell';
import VfContainer from '@codemonster-ru/vueforge-layouts/container';
```

Browser component subpaths auto-load their component CSS, but not the Core or Layouts shared
foundation entries shown above. Node ESM subpath conditions are CSS-free for SSR.

For fully manual browser delivery, import named components from the CSS-free package root and add
their component CSS explicitly; do not combine explicit component CSS with a browser component
subpath. `auth-layout`, `document-layout`, and `setup-layout` also require `container.css`. Their
browser subpaths include it automatically.

## Public entries

- Root plugin, layout components, responsive composables, and theme helpers.
- Seventeen component subpaths, including `./container`, `./grid`, `./app-shell`, and shell areas.
- Full and granular CSS entries, including `./styles.css`, `./breakpoints.css`, and component CSS.
- ESM and CommonJS root entries for SSR.

## More documentation

For full documentation, visit [docs.codemonster.net/vueforge/layouts](https://docs.codemonster.net/vueforge/layouts/).
See the repository
[installation guide](https://github.com/codemonster-ru/codemonster-ui/blob/main/docs/layouts/installation.md)
and [CHANGELOG.md](https://github.com/codemonster-ru/codemonster-ui/blob/main/packages/layouts/CHANGELOG.md).

## License

[MIT](https://github.com/codemonster-ru/codemonster-ui/blob/main/packages/layouts/LICENSE)
