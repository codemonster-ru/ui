# VueForge Theme API

This document describes the current theme runtime for `@codemonster-ru/vueforge-core`.

The shared theme engine now lives in `@codemonster-ru/vueforge-theme`, while `vueforge-core` owns the built-in default preset and Vue integration layer.

## Current Model

VueForge now has two theme layers:

- `theme mode`: `light | dark | system`
- `theme preset`: the token set that defines colors, radius, spacing, sizes, and semantic values

In package terms:

- `@codemonster-ru/vueforge-theme` provides:
  - theme types
  - preset resolution helpers
  - CSS variable serialization helpers
  - mode helpers
  - shared motion tokens
- `@codemonster-ru/vueforge-core` provides:
  - `defaultThemePreset`
  - `VueForgeCore` / `createVueForgeCore`
  - `VfThemeProvider`
  - `useTheme()`

The canonical built-in preset assembly lives in [src/theme/default-preset-source.ts](../src/theme/default-preset-source.ts),
while primitive values and mode-specific semantic maps live in
[src/theme/color-token-schema.ts](../src/theme/color-token-schema.ts). The color-name contract is shared by
`@codemonster-ru/vueforge-theme`.

Static CSS files still exist as the package baseline:

- generated token/theme CSS owned by [build/theme-css-artifacts.ts](../build/theme-css-artifacts.ts)
- the narrow baseline entry in [src/styles/foundation.css](../src/styles/foundation.css)

These are fallback defaults for consumers who import the package CSS. Runtime theme configuration should be treated as the primary API.

## Color Token Architecture

The built-in color contract has three token layers. Components consume semantic decisions while component tokens remain
the local customization boundary:

```text
component CSS → existing component token → semantic role → primitive material
```

- 66 `palette*` primitives form seven mode-independent OKLCH scales.
- 85 `color*` semantic roles describe backgrounds, text, icons, borders, interaction, links, and five status families.
- 807 shared and component tokens define typography, geometry, and local customization boundaries.
- The built-in preset contains 958 keys in total.

The shared theme package exports the canonical tuples and their derived types; Core re-exports the same contract:

```ts
import {
  vfPrimitiveColorTokenNames,
  vfSemanticColorTokenNames,
  type VfPrimitiveColorTokenName,
  type VfPrimitiveColorTokens,
  type VfSemanticColorTokenName,
  type VfSemanticColorTokens,
} from '@codemonster-ru/vueforge-theme';
```

The tuples are the machine-readable contract for tests, tooling, and documentation. Do not maintain a second handwritten list.

See the [Color Tokens guide](../../../docs/core/guides/color-tokens.md) for the complete palette, role map, naming rules, and component migration policy.
See [Theme Configuration](../../../docs/core/guides/theme-configuration.md) for the supported
application setup, mode priority, scoped boundaries, custom prefixes, and fallback behavior.

## Installation

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';

const app = createApp(App);

app.use(VueForgeCore);
```

This installs VueForge with the built-in default preset.

If you want to customize the design tokens, pass a `theme` object explicitly.

## Recommended Setup

VueForge theme setup is one system with two layers:

- token preset configuration in `app.use(VueForgeCore, { theme })`
- mode selection in `VfThemeProvider` and `useTheme()`

```ts
app.use(VueForgeCore, {
  theme: {
    preset: defaultThemePreset,
    extend: {
      colorInteractivePrimaryBackground: '#0f766e',
      colorInteractivePrimaryHoverBackground: '#0d655f',
      colorInteractivePrimaryActiveBackground: '#0a524d',
      colorInteractivePrimaryForeground: '#ffffff',
    },
  },
  defaultTheme: 'system',
  themeStorageKey: 'vf-theme',
});
```

```vue
<VfThemeProvider>
  <App />
</VfThemeProvider>
```

## Theme Config

```ts
app.use(VueForgeCore, {
  theme: {
    preset,
    extend,
    light,
    dark,
    options,
  },
});
```

Primitive and semantic overrides use the same configuration surface:

```ts
app.use(VueForgeCore, {
  theme: {
    preset: defaultThemePreset,
    extend: {
      palettePrimary600: '#0f766e',
      colorInteractivePrimaryBackground: 'var(--vf-palette-primary-600)',
      colorInteractivePrimaryHoverBackground: '#0d655f',
      colorInteractivePrimaryActiveBackground: '#0a524d',
      colorInteractivePrimaryForeground: '#ffffff',
    },
  },
});
```

Core component defaults resolve through semantic roles. Existing component-token overrides still win because component CSS
continues to consume that boundary.

Base component-token overrides remain effective, but newly independent compound states are semantic-first. For example, a
custom `tabsTabActiveBackground` controls the selected base and remains the component-token fallback; customize
`colorBackgroundSurfaceSelectedHover` and `colorBackgroundSurfaceSelectedActive` as well when the complete selected recipe
must change.

### `preset`

Base theme definition. The default workflow in `core` is to start from the built-in preset and extend it inside the same app.

```ts
import { createThemePreset, defaultThemePreset } from '@codemonster-ru/vueforge-core';

const customPreset = createThemePreset({
  name: 'custom',
  tokens: {
    ...defaultThemePreset.tokens,
    colorInteractivePrimaryBackground: '#0f766e',
    colorInteractivePrimaryHoverBackground: '#0d655f',
    colorInteractivePrimaryActiveBackground: '#0a524d',
    colorInteractivePrimaryForeground: '#ffffff',
  },
  dark: {
    ...defaultThemePreset.dark,
    colorInteractivePrimaryBackground: '#5eead4',
    colorInteractivePrimaryHoverBackground: '#45d6c4',
    colorInteractivePrimaryActiveBackground: '#2bbfac',
    colorInteractivePrimaryForeground: '#102a2a',
  },
});
```

### `extend`

Shared overrides applied to both light and dark.

```ts
app.use(VueForgeCore, {
  theme: {
    preset: defaultThemePreset,
    extend: {
      radius: '0.875rem',
      controlHeightMd: '2.375rem',
    },
  },
});
```

### `light`

Overrides only for the light theme.

```ts
app.use(VueForgeCore, {
  theme: {
    preset: defaultThemePreset,
    light: {
      colorBackgroundSurface: '#ffffff',
      colorBackgroundSurfaceSubtle: '#f8fafc',
    },
  },
});
```

### `dark`

Overrides only for the dark theme.

```ts
app.use(VueForgeCore, {
  theme: {
    preset: defaultThemePreset,
    dark: {
      colorBackgroundSurface: '#111827',
      colorBorderDefault: '#334155',
    },
  },
});
```

### `options`

Controls how runtime CSS variables are written.

```ts
app.use(VueForgeCore, {
  theme: {
    preset: defaultThemePreset,
    options: {
      prefix: 'vf',
      rootSelector: ':root',
      darkModeSelector: ":root[data-vf-theme='dark']",
      attribute: 'data-vf-theme',
      storageKey: 'vf-theme',
      styleId: 'vf-theme-preset',
    },
  },
});
```

## Theme Mode

`VfThemeProvider` and `useTheme()` still manage the mode layer:

```vue
<VfThemeProvider>
  <App />
</VfThemeProvider>
```

```ts
const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
```

Provider behavior:

- `defaultTheme`, `themeStorageKey`, and `themeAttribute` can be passed through the Vue plugin
- `VfThemeProvider` uses those plugin defaults when its own props are omitted
- provider props still win when you need a local override
- mode state still supports `light`, `dark`, and `system`
- the selected preference is persisted to `localStorage`, system mode resolves through `matchMedia`,
  and the resolved light/dark mode is written to the configured attributes

## Public Theme API

Stable public theme API for V2:

- `VueForgeCore`
- `createVueForgeCore`
- `defaultThemePreset`
- `createThemePreset`
- `VfThemeProvider`
- `useTheme`
- theme types such as `VfThemeConfig`, `VfThemePreset`, and `VfThemeTokens`

Core and the shared `@codemonster-ru/vueforge-theme` package additionally export:

- `vfPrimitiveColorTokenNames` and `vfSemanticColorTokenNames`
- `VfPrimitiveColorTokenName` and `VfPrimitiveColorTokens`
- `VfSemanticColorTokenName` and `VfSemanticColorTokens`

Lower-level engine helpers live in `@codemonster-ru/vueforge-theme`. `vueforge-core` does not need to re-export every runtime helper just because the engine supports it.

## Documentation Pattern

`vueforge-core` also provides a small docs-navigation stack for docs-style pages:

- semantic HTML content
- `VfTableOfContents` for anchor navigation
- `useTableOfContents()` for active-section tracking

```ts
const items = [
  { id: 'getting-started', label: 'Getting started', level: 1 },
  { id: 'installation', label: 'Installation', level: 2 },
  { id: 'theme-api', label: 'Theme API', level: 2 },
];

const { activeId } = useTableOfContents({
  items,
  offset: 96,
});
```

```vue
<p>On This Page</p>
<VfTableOfContents aria-label="Page navigation" :items="items" :active-id="activeId" />

<article>
  <h2 id="getting-started">Getting started</h2>
  <h3 id="installation">Installation</h3>
  <h3 id="theme-api">Theme API</h3>
</article>
```

## Current Boundary

Current behavior:

- presets are defined in TS
- the built-in preset contains 958 keys: 66 primitives, 85 semantic roles, and 807 shared or component tokens
- light and dark modes provide complete 85-role semantic maps; the dark preset emits 101 intentional overrides
- CSS variables are emitted through the same serializer for runtime and static artifacts
- the plugin injects a `<style>` tag with light and dark token values
- full, scoped-theme, fallback, and custom-prefix paths share the same token contract
- granular static consumption uses `tokens.css + theme.css + base.css + component entry`; an isolated
  component entry relies on runtime theme injection

Current scope for `core`:

- one built-in default preset inside `@codemonster-ru/vueforge-core`
- runtime theme configuration through the Vue plugin
- shared neutral engine in `@codemonster-ru/vueforge-theme`
- higher-level packages may build on the same engine without making `core` aware of them
