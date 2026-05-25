# Features

Top-level shell component for header/sidebar/content/footer composition.

## Import

Import statement for this component.

```ts
import { VfAppShell } from '@codemonster-ru/vueforge-layouts';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAppShell>
    <template #header><div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border)">Header</div></template>
    <template #sidebar><div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border)">Sidebar</div></template>
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border)">Main content</div>
    <template #aside><div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border)">Aside</div></template>
    <template #footer><div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border)">Footer</div></template>
  </VfAppShell>
</template>

<script setup>
import { VfAppShell } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- App shell should define stable global structure for navigation, primary content, and auxiliary regions.
- Ensure each region used as navigation/content utility has clear landmark labeling.
- Preserve focus order consistency across route/content changes inside shell.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Shell wrapper is not focusable by default; focus moves through interactive controls across composed regions. |

