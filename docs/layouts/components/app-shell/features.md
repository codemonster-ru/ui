# Features

Top-level shell component for header/sidebar/content/footer composition.

## Summary

Top-level shell component for header/sidebar/content/footer composition.

## Import

```ts
import { VfAppShell } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAppShell>
    <template #header><div style="padding:8px;border:1px solid #d1d5db">Header</div></template>
    <template #sidebar><div style="padding:8px;border:1px solid #d1d5db">Sidebar</div></template>
    <div style="padding:8px;border:1px solid #d1d5db">Main content</div>
    <template #aside><div style="padding:8px;border:1px solid #d1d5db">Aside</div></template>
    <template #footer><div style="padding:8px;border:1px solid #d1d5db">Footer</div></template>
  </VfAppShell>
</template>

<script setup>
import { VfAppShell } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- App shell should define stable global structure for navigation, primary content, and auxiliary regions.
- Ensure each region used as navigation/content utility has clear landmark labeling.
- Preserve focus order consistency across route/content changes inside shell.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Shell wrapper is not focusable by default; focus moves through interactive controls across composed regions. |

