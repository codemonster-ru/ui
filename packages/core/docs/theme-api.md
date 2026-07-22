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

The canonical built-in VueForge design language lives in [src/theme/default-preset.ts](../src/theme/default-preset.ts), with the primitive and semantic color-name contract shared by `@codemonster-ru/vueforge-theme`.

Static CSS files still exist as the package baseline:

- generated token CSS in [.generated/theme](../.generated/theme)
- the narrow baseline entry in [src/styles/foundation.css](../src/styles/foundation.css)

These are fallback defaults for consumers who import the package CSS. Runtime theme configuration should be treated as the primary API.

## Color Token Architecture

The built-in color contract has three token layers. During the VueForge 1.x transition, existing component aliases and the new semantic roles both resolve through the compatibility roots:

```text
current component alias ────────────┐
                                    ├─→ legacy 1.x root → primitive material
new semantic role ──────────────────┘

Phase 2 target: component decision → semantic role
```

- 29 `palette*` primitives contain only material values already present in the light and dark themes.
- 77 `color*` semantic roles describe backgrounds, text, icons, borders, interaction, and five status families.
- All 847 pre-Phase-1 tokens remain available. No legacy key is removed or renamed.
- `colorFocusRing` belongs to both the existing and semantic sets, so Phase 1 adds 105 unique keys and the built-in preset contains 952 keys in total.

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
      // Compatibility root: affects current 1.x components and its semantic aliases.
      colorPrimary: '#ff5a36',
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
    },
  },
});
```

Core component state migration is intentionally deferred to Phase 2. For VueForge 1.x components that still consume a legacy root such as `colorPrimary`, override that legacy root or the component token. The new semantic contract is additive and available now; it does not silently change existing component recipes.

### `preset`

Base theme definition. The default workflow in `core` is to start from the built-in preset and extend it inside the same app.

```ts
import { createThemePreset, defaultThemePreset } from '@codemonster-ru/vueforge-core';

const customPreset = createThemePreset({
  name: 'custom',
  tokens: {
    ...defaultThemePreset.tokens,
    colorPrimary: '#0f766e',
  },
  dark: {
    colorPrimary: '#5eead4',
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
      colorSurface: '#ffffff',
      colorSurfaceMuted: '#f8fafc',
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
      colorSurface: '#111827',
      colorBorder: '#334155',
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
- resolved mode still syncs to `localStorage`, `matchMedia`, and `data-vf-theme`

## Public Theme API

Stable public theme API for `1.x`:

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
- the built-in preset contains 952 keys: 847 retained legacy keys, 29 primitives, and 76 additional semantic keys
- CSS variables are emitted through the same serializer for runtime and static artifacts
- the plugin injects a `<style>` tag with light and dark token values
- full, scoped-theme, fallback, and custom-prefix paths share the same token contract
- selective static consumption uses `foundation.css + component entry`; an isolated component entry relies on runtime theme injection

Current scope for `core`:

- one built-in default preset inside `@codemonster-ru/vueforge-core`
- runtime theme configuration through the Vue plugin
- shared neutral engine in `@codemonster-ru/vueforge-theme`
- higher-level packages may build on the same engine without making `core` aware of them
