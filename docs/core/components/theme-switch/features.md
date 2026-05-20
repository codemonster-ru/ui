# Features

## Summary

Theme toggle component with `switch` and `button` variants.

## Import

```ts
import { VfThemeSwitch } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:12px;align-items:center">
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

### Screen Reader

- Theme switch should announce current mode and action (for example, “Switch to dark theme”).
- Control must have explicit accessible name since icon-only affordances are common.
- Expose active/pressed state so current theme is discoverable to assistive technologies.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to theme switch. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Enter` | Toggles theme. |
| `Space` | Toggles theme. |

