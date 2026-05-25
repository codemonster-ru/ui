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

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Theme switch should announce current mode and action (for example, “Switch to dark theme”).
- Control must have explicit accessible name since icon-only affordances are common.
- Expose active/pressed state so current theme is discoverable to assistive technologies.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to theme switch. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Enter` | Toggles theme. |
| `Space` | Toggles theme. |

