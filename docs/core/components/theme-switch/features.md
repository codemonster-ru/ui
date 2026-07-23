# Features

Theme toggle component with `switch` and `button` variants.

## Import

Import statement for this component.

```ts
import { VfThemeSwitch } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:var(--vf-surface-padding-compact);align-items:center">
    <VfThemeSwitch label="Theme" />
    <VfThemeSwitch variant="button">Toggle Theme</VfThemeSwitch>
  </div>
</template>

<script setup>
import { VfThemeSwitch } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Notes

Additional implementation notes and caveats:

- `VfThemeSwitch` is SSR-safe: initial checked state is synchronized after mount to keep hydration markup stable.
- Theme resolution can reuse an already-present `data-vf-theme` root attribute before applying
  fallback defaults.

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- The `switch` variant exposes its checked state with native switch semantics.
- The `button` variant and icon-only `switch` announce the next action (for example, “Switch to dark
  theme”). A labeled `switch` uses its visible label together with the native checked state.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key           | Function                                   |
| ------------- | ------------------------------------------ |
| `Tab`         | Moves focus to theme switch.               |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Enter`       | Toggles theme in the `button` variant.     |
| `Space`       | Toggles theme.                             |
