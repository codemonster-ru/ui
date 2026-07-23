---
title: 'Theme Configuration'
description: 'Runtime themes, mode switching, scoped boundaries, custom prefixes, and CSS fallback behavior'
order: 3
---

# Theme Configuration

VueForge separates theme values from theme mode:

- the Core plugin resolves the preset and writes CSS custom properties in the browser;
- `VfThemeProvider` owns the reactive `light`, `dark`, or `system` mode;
- `VfThemeSwitch` and `useTheme()` read and update that provider state;
- static CSS supplies a usable fallback when JavaScript has not run.

The provider does not register components and does not render a DOM wrapper. Import components
directly and use an element or data attribute when you need a scoped theme boundary.

## Recommended Setup

Install the Core plugin once and place the provider above every component that calls `useTheme()` or
renders `VfThemeSwitch`:

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';
import App from './App.vue';

createApp(App).use(VueForgeCore, { defaultTheme: 'system' }).mount('#app');
```

```vue
<script setup lang="ts">
import { VfButton, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
</script>

<template>
  <VfThemeProvider>
    <VfThemeSwitch label="Theme" />
    <VfButton>Continue</VfButton>
  </VfThemeProvider>
</template>
```

See [Installation](/core/installation) for full, granular, and manual CSS delivery.

## Token Layers

The built-in theme contains three layers:

1. OKLCH `palette*` primitives provide material values.
2. `color*` semantic tokens describe interface decisions.
3. Component tokens remain the local override boundary and resolve through semantic roles.

Prefer semantic tokens when changing an interface decision. Use primitives to construct a theme, not
directly in component CSS. The exact names and supported contrast pairings are documented in
[Color Tokens](/core/guides/color-tokens).

## Runtime Overrides

The `theme` option accepts a complete `preset` plus three override layers. Resolution order is:

```text
light = preset.tokens → extend → light
dark  = preset.tokens → preset.dark → extend → dark
```

The built-in preset is used when `preset` is omitted. This is the smallest customization surface:

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import App from './App.vue';

const app = createApp(App);

app.use(VueForgeCore, {
  defaultTheme: 'system',
  theme: {
    extend: {
      radiusControl: '0.75rem',
    },
    light: {
      colorInteractivePrimaryBackground: 'var(--vf-palette-primary-700)',
    },
    dark: {
      colorInteractivePrimaryBackground: 'var(--vf-palette-primary-400)',
    },
  },
});

app.mount('#app');
```

`extend` affects both modes. `light` and `dark` win for their respective modes. Keep each semantic
foreground/background pair together and re-run contrast checks when changing color roles.

For a reusable complete preset, start from the built-in one so the full primitive, semantic, and component contract stays
present:

```ts
import { createThemePreset, defaultThemePreset } from '@codemonster-ru/vueforge-core';

export const productTheme = createThemePreset({
  ...defaultThemePreset,
  name: 'product',
  tokens: {
    ...defaultThemePreset.tokens,
    radiusControl: '0.75rem',
  },
  dark: {
    ...defaultThemePreset.dark,
  },
});
```

Pass it as `theme: { preset: productTheme }`. Do not replace the preset with a partial token object;
`tokens` is the complete light-mode base.

## Mode Switching

`useTheme()` is available only below `VfThemeProvider`:

```vue
<script setup lang="ts">
import { useTheme } from '@codemonster-ru/vueforge-core';

const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
</script>

<template>
  <p>Preference: {{ theme }}; active colors: {{ resolvedTheme }}</p>
  <button type="button" @click="setTheme('system')">Use system theme</button>
  <button type="button" @click="toggleTheme()">Toggle light/dark</button>
</template>
```

- `theme` is the stored preference: `light`, `dark`, or `system`.
- `resolvedTheme` is always `light` or `dark`.
- `toggleTheme()` selects the opposite resolved mode explicitly; it does not return to `system`.

### `VfThemeProvider` contract

| Prop           | Type                            | Default resolution                                                             | Purpose                                                       |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `defaultTheme` | `'light' \| 'dark' \| 'system'` | Core plugin `defaultTheme`, then `'system'`                                    | Initial preference before browser state is read               |
| `storageKey`   | `string`                        | Core plugin `themeStorageKey`, theme option `storageKey`, then `'vf-theme'`    | `localStorage` key for the selected preference                |
| `attribute`    | `string`                        | Core plugin `themeAttribute`, theme option `attribute`, then `'data-vf-theme'` | Additional root attribute synchronized with the resolved mode |

The component exposes one default slot with no slot props and renders that content unchanged. A
provider prop takes precedence over its corresponding plugin or theme option. On mount and each mode
update, the provider writes the same resolved value to `data-vf-theme`, the theme-engine attribute,
and the configured provider attribute on every matched root.

After mount, the provider chooses the preference in this order:

1. a valid value in its configured `localStorage` key;
2. a valid light/dark attribute on the configured root;
3. `defaultTheme`, which defaults to `system`.

When the chosen preference is `system`, `prefers-color-scheme` determines the resolved mode. Changes
made through the provider are persisted when storage is available. Blocked storage or unavailable
`matchMedia` does not throw; the configured initial mode remains the fallback.

## Scoped Themes

Both runtime and static theme CSS emit complete light and dark maps for nested boundaries. Use
`data-vf-theme`:

```vue
<template>
  <main>
    <section data-vf-theme="dark">
      <h2>Dark panel</h2>

      <aside data-vf-theme="light">This nested region returns to light mode.</aside>
    </section>
  </main>
</template>
```

Each boundary also sets the matching `color-scheme`. Boundaries can be nested and reversed. Values
other than `light` and `dark`, including `inherit`, do not create a Core theme boundary.

`VfThemeProvider` synchronizes configured roots; it does not turn its slot into a local theme scope.
For a provider-controlled local root, give a real element a selector and use that selector in the
plugin options:

```ts
app.use(VueForgeCore, {
  defaultTheme: 'dark',
  theme: {
    options: {
      rootSelector: '#product-shell',
    },
  },
});
```

```vue
<template>
  <div id="product-shell">
    <VfThemeProvider>
      <AppContent />
    </VfThemeProvider>
  </div>
</template>
```

The selector must match the intended root by the time the provider mounts. When the Core integration
can validate selectors in a browser, it normalizes an invalid selector to `:root`.

## Custom Attribute and Prefix

Runtime output can use a custom attribute, storage key, style element ID, root selector, and variable
prefix:

| Theme option       | Default                             | Purpose                                                        |
| ------------------ | ----------------------------------- | -------------------------------------------------------------- |
| `prefix`           | `'vf'`                              | CSS custom-property namespace                                  |
| `rootSelector`     | `':root'`                           | Root that receives base variables and provider mode attributes |
| `darkModeSelector` | Derived from the root and attribute | Additional selector that receives the dark variable map        |
| `attribute`        | `'data-vf-theme'`                   | Theme-engine light/dark attribute and scoped selector          |
| `storageKey`       | `'vf-theme'`                        | Provider persistence fallback                                  |
| `styleId`          | `'vf-theme-preset'`                 | ID of the runtime-generated `<style>` element                  |

```ts
app.use(VueForgeCore, {
  defaultTheme: 'system',
  theme: {
    options: {
      rootSelector: '#app',
      attribute: 'data-product-theme',
      storageKey: 'product-theme',
      styleId: 'product-theme-vars',
      prefix: 'product',
    },
  },
});
```

Core emits requested `--product-*` variables and canonical `--vf-*` bridges because compiled
VueForge component CSS reads the canonical namespace. Do not hand-write only the custom-prefixed
variables: without the canonical bridges, Core and Layouts components cannot consume them.

The configured attribute is synchronized together with `data-vf-theme`. Both remain valid for
scoped light/dark boundaries.

## Static and Runtime Fallbacks

| Setup                                                          | Initial behavior                                 | Mode behavior                                                           |
| -------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `styles.css` or `tokens.css` + `theme.css`, no plugin/provider | Built-in light variables                         | Set `data-vf-theme="dark"` explicitly                                   |
| Core plugin, no provider                                       | Runtime token values are injected in the browser | No reactive mode owner                                                  |
| Core plugin + provider                                         | Configured initial mode is hydration-stable      | Storage, root attribute, and system preference are resolved after mount |
| Scoped data attribute                                          | Complete local light/dark variable map           | Nearest valid nested boundary wins                                      |

Static CSS intentionally defaults to light. It does not switch from `prefers-color-scheme` by itself.
Use `VfThemeProvider` for a reactive system preference, or set a root mode attribute in application
bootstrap code.

The package CSS remains the fallback even when runtime generation is enabled. Keep `tokens.css` and
`theme.css` in a granular setup; a component CSS entry alone does not contain the complete theme.

## Low-Level Theme Engine

`@codemonster-ru/vueforge-theme` is the framework-agnostic engine behind Core. It exports token
serialization, preset resolution, CSS-text generation, and DOM application helpers. Use it for
tooling or server-generated CSS when you own the complete preset.

`themePresetToCssText()` is DOM-free. `applyThemeConfig()` writes to a `Document` and is therefore a
browser operation unless an explicit document is supplied. The neutral engine does not add Core's
custom-prefix canonical bridges; Vue applications using VueForge components should normally
configure themes through the Core plugin.
