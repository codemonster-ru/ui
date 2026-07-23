---
title: 'SSR and Hydration'
description: 'Vue SSR, Vite SSR, Nuxt, CSS delivery, theme bootstrap, and hydration guidance'
order: 5
---

# SSR and Hydration

VueForge Core, Layouts, Icons, CodeBlock, and Playground publish DOM-free Node entry conditions.
Browser component entries can auto-load CSS, while Node conditions intentionally do not evaluate
CSS. Add styles to the client build explicitly.

Core and Layouts support Node.js 18 or newer. CodeBlock and Playground require Node.js 20 or newer
for consumer tooling and SSR.

## Vue SSR

Create a fresh Vue app for every request and install the same VueForge configuration on the server
and client:

```ts
// src/app.ts
import { createSSRApp } from 'vue';
import VueForgeCore, { type VfThemeMode } from '@codemonster-ru/vueforge-core';
import App from './App.vue';

export function createApp(defaultTheme: VfThemeMode = 'light') {
  const app = createSSRApp(App);
  app.use(VueForgeCore, { defaultTheme });
  return app;
}
```

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { VfThemeProvider } from '@codemonster-ru/vueforge-core';
</script>

<template>
  <VfThemeProvider>
    <main>
      <h1>Server-rendered application</h1>
    </main>
  </VfThemeProvider>
</template>
```

Server entry:

```ts
// src/entry-server.ts
import { renderToString } from 'vue/server-renderer';
import { createApp } from './app';

export async function render() {
  return renderToString(createApp('light'));
}
```

Client entry:

```ts
// src/entry-client.ts
import '@codemonster-ru/vueforge-core/styles.css';
import { createApp } from './app';

createApp('light').mount('#app');
```

`VueForgeCore` guards its browser-only theme application, so the universal plugin can be installed in
both environments. `VfThemeProvider` does not read storage, DOM attributes, or `matchMedia` until
mount. Its server render and first client render therefore stay deterministic.

The [Vue SSR guide](https://vuejs.org/guide/scaling-up/ssr.html) remains the source of truth for app
factories, hydration, request isolation, lifecycle restrictions, and Teleport handling.

## Vite SSR

Use the same app factory from both Vite entries. Keep CSS in the client entry or client stylesheet;
do not rely on a server import to inject it. The package `node` conditions select CSS-free component
modules during the server build.

If the app uses standalone packages, add their styles to the client graph too:

```ts
import '@codemonster-ru/vueforge-core/styles.css';
import '@codemonster-ru/vueforge-codeblock/style.css';
import '@codemonster-ru/vueforge-playground/style.css';
```

Only import the packages used by the application. For manual Core CSS delivery, use the CSS-free
Core root plus `tokens.css`, `theme.css`, `base.css`, and the selected component CSS entries.

Follow the official [Vite SSR guide](https://vite.dev/guide/ssr) for the two-build pipeline, manifest
handling, asset links, and development server integration. VueForge does not replace that
application-level setup.

## Nuxt

VueForge does not currently ship a Nuxt module. Configure the universal Vue plugin and global CSS
explicitly.

For Nuxt 4:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@codemonster-ru/vueforge-core/styles.css'],
});
```

```ts
// app/plugins/vueforge.ts
import VueForgeCore from '@codemonster-ru/vueforge-core';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueForgeCore, {
    defaultTheme: 'light',
  });
});
```

```vue
<!-- app/app.vue -->
<script setup lang="ts">
import { VfThemeProvider } from '@codemonster-ru/vueforge-core';
</script>

<template>
  <VfThemeProvider>
    <NuxtPage />
  </VfThemeProvider>
</template>
```

The plugin is universal and does not need a `.client` suffix. Add CodeBlock or Playground CSS to
the `css` array only when those packages are used. Nuxt documents universal/client/server
[plugins](https://nuxt.com/docs/4.x/directory-structure/app/plugins) and
[global styling](https://nuxt.com/docs/4.x/getting-started/styling).

Core, CodeBlock, and the Playground UI have deterministic server-first behavior. Do not wrap them in
`<ClientOnly>` merely because they become interactive after mount. Use Nuxt
[`<ClientOnly>`](https://nuxt.com/docs/4.x/api/components/client-only) only for consumer code that
itself depends on browser-only APIs, and provide a stable fallback when layout continuity matters.

Nuxt 3 uses the same Vue plugin and CSS concepts, but its application directory conventions may
differ. Follow the documentation for the Nuxt major used by the application.

## Theme Bootstrap

The initial theme value must be identical in server and client app factories.

If the server knows a validated light/dark preference from a cookie:

1. pass that mode as `defaultTheme` to the server app;
2. serialize the same validated value into the HTML response;
3. use it for the client app factory;
4. set the matching `data-vf-theme` attribute on the theme root before the stylesheet paints.

Escape serialized data for its HTML context and accept only `light`, `dark`, or `system`. Do not
insert an untrusted cookie value into an attribute or inline script.

If the server cannot know the preference, use the same deterministic default in both factories.
With `system`, VueForge renders the light resolved mode on the server and first client render, then
applies storage or `prefers-color-scheme` after mount. Hydration stays stable, but a brief first-paint
theme change is possible. Preventing that flash requires an application-owned cookie or early
attribute bootstrap.

See [Theme Configuration](/core/guides/theme-configuration) for storage priority, scoped boundaries,
custom attributes, and static fallback behavior.

### Custom runtime token CSS

The Core plugin cannot write its runtime `<style>` element while no `document` exists. Package CSS
therefore supplies the built-in preset during SSR and early paint. If an application requires a
custom preset on first paint, generate the same canonical-prefix CSS during the build or server
render. This advanced path imports the low-level engine directly, so declare Theme as an application
dependency instead of relying on Core's transitive dependency:

```bash
npm install @codemonster-ru/vueforge-theme@^2.0.0
pnpm add @codemonster-ru/vueforge-theme@^2.0.0
yarn add @codemonster-ru/vueforge-theme@^2.0.0
```

```ts
import { defaultThemePreset, type VfThemeConfig } from '@codemonster-ru/vueforge-core';
import { resolveThemeConfig, themePresetToCssText } from '@codemonster-ru/vueforge-theme';

export const themeConfig = {
  preset: defaultThemePreset,
  extend: {
    radiusControl: '0.75rem',
  },
} satisfies VfThemeConfig;

export const themeCss = themePresetToCssText(resolveThemeConfig(themeConfig));
```

Install `themeConfig` through `app.use(VueForgeCore, { theme: themeConfig })` in both app factories,
and place `themeCss` after the package stylesheet in the HTML cascade. Do not build CSS values from
untrusted input. Apply the application's CSP nonce when inline styles require one.

Keep the `vf` prefix in this server path. The neutral Theme engine does not generate Core's
custom-prefix bridges; a custom prefix needs an application-owned build step that emits the same
canonical `--vf-*` bridge as the Core browser integration.

## Hydration Rules

- Do not branch template structure on `window`, `document`, random values, or local time during the
  first render.
- Create the app, router, stores, and request state per SSR request.
- Use the same VueForge options and component props on the server and first client render.
- Keep browser-only work in `onMounted`.
- Keep VueForge CSS in the client build even though server imports are CSS-free.
- Treat hydration warnings as release failures; do not suppress a whole component subtree.

VueForge uses request-stable Vue IDs for component ARIA relationships. Consumer-provided IDs must
also be deterministic and unique.

## Overlays and Teleports

Dialog, Drawer, Command Palette, Select, Dropdown, Popover, and Tooltip can Teleport. Prefer keeping
interactive overlays closed during the initial server render. If an overlay must be server-rendered
open, follow the framework's Teleport serialization rules or set the component's documented
`disableTeleport`/`teleportTo` option and use a stable dedicated target.

Do not target `body` manually when an SSR framework requires a dedicated Teleport container. Server
and client targets must match.

## CodeBlock and Playground

`VfCodeBlock` can finish Shiki highlighting during server rendering and preserves that markup during
hydration. Import it from `@codemonster-ru/vueforge-codeblock/view`; keep `style.css` in the client
stylesheet.

`VfPlayground` from `@codemonster-ru/vueforge-playground/ui` renders a deterministic shell on the
server and defers iframe/session work until the browser is available. Its sandbox compiler remains a
large lazy client runtime. Do not import `@codemonster-ru/vueforge-playground/runtime` into the
initial server or client graph unless direct session creation is required.

With `theme="inherit"`, CodeBlock and Playground expose a deterministic SSR fallback and resolve the
nearest valid light/dark boundary after mount. Keep the same `theme` prop in both renders.

## What the Repository Validates

Automated contracts cover Vue server rendering, request-stable IDs, ThemeProvider hydration,
server-highlighted CodeBlock hydration, Playground first-render parity, CSS-free Node entry
conditions, and packed-consumer SSR.

The repository does not contain a Nuxt end-to-end fixture or hosted SSR deployment. Nuxt plugin
integration, streaming, framework-specific Teleport handling, edge runtimes, and production
first-paint behavior must be validated in the consuming application.
