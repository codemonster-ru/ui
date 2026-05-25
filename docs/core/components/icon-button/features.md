# Features

Icon-only button for compact actions in toolbars and controls.

## Import

Import statement for this component.

```ts
import { VfIconButton } from '@codemonster-ru/vueforge-core';
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
  <div style="display:flex;gap:var(--vf-surface-gap);align-items:center">
    <VfIconButton :icon="icons.magnifyingGlass" aria-label="Search" />
    <VfIconButton :icon="icons.gear" variant="secondary" aria-label="Settings" />
  </div>
</template>

<script setup>
import { icons } from '@codemonster-ru/vueforge-icons';
import { VfIconButton } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native `<button>` semantics for correct announcement and keyboard activation.
- Always provide an explicit `aria-label` because icon-only content has no readable text by default.
- Use native `disabled` state for non-interactive actions.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to the icon button. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Enter` | Activates action. |
| `Space` | Activates action. |

