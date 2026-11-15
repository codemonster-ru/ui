# Theme switch recipe

Theming uses three document preferences: `light`, `dark`, and `system`.
`system` uses `prefers-color-scheme` even with JavaScript disabled. For a preview inside
a page, put an explicit `data-cm-theme="light"` or `data-cm-theme="dark"` on the preview
container. Import the [tokens and shared CSS](../css/getting-started.md) once.

## Vue

Wrap the app in `CmThemeProvider`; `CmThemeSwitch` consumes the provided preference
and updates it when a user chooses a mode. If you build your own theme control, use
`useCmTheme()` in a child of this provider to read `theme` and `resolvedTheme` or call
`setTheme(mode)`. Calling it outside the provider throws.

```vue
<script setup lang="ts">
import { CmThemeProvider, CmThemeSwitch } from '@codemonster-ru/ui-vue';
import type { CmThemeMode } from '@codemonster-ru/ui-runtime/core';

defineProps<{ initialTheme?: CmThemeMode }>();
</script>

<template>
  <CmThemeProvider :default-theme="initialTheme ?? 'system'">
    <CmThemeSwitch legend="Color theme" />
    <!-- application content -->
  </CmThemeProvider>
</template>
```

The provider uses the `cm-theme` cookie by default. If you deliberately configure a
`storage-key`, it uses local storage instead. The server cannot read local storage; a
static app can use a small CSP-approved bootstrap before CSS if it must apply such a
preference before first paint.

## Server rendering

Read the cookie through the runtime's pure server-safe entry:

```ts file=/initial-theme.ts
import { readCmThemeCookie } from '@codemonster-ru/ui-runtime/core';

export function initialTheme(cookieHeader: string | null) {
  return readCmThemeCookie(cookieHeader) ?? 'system';
}
```

Render the result in the document's `data-cm-theme` attribute. In Vue SSR, pass that same
value as `initialTheme` during server render and hydration. If you cache HTML responses,
make the cache account for the chosen theme.

## Vanilla HTML

Render the [canonical radio group](../../contracts/theme-switch/cases/default.html)
and set the checked radio to match the document preference. Register only the controller
the page needs:

```ts file=/theme-runtime.ts
import { CmRuntime, createCmThemeSwitchController } from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime().register('theme-switch', createCmThemeSwitchController);
runtime.start(document);
```

The controller writes the document attribute and the `cm-theme` cookie on change.
Listen for the bubbling `cm:theme-change` event for `detail.mode` (the preference) and
`detail.resolved` (what the visitor sees). The controller preserves the server's
initial markup. See [Vanilla setup](../vanilla.md) for bundles and teardown.

If you are migrating the historical `VfThemeProvider` and `VfThemeSwitch`, see
[the historical Vue plugin recipe](./vue-theme-plugin.md).
