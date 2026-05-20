# Features

## Summary

Collapsible section with controlled or uncontrolled open state.

## Import

```ts
import { VfAccordion } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAccordion title="What is VueForge?" :default-open="true">
    VueForge is a UI toolkit with composable primitives and higher-level components.
  </VfAccordion>
</template>

<script setup>
import { VfAccordion } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

### Screen Reader

- Trigger button exposes `aria-expanded` and `aria-controls` for expanded/collapsed state announcement.
- Expanded panel uses `role="region"` and `aria-labelledby` linked to the trigger.
- Use concise, descriptive trigger titles so screen reader users can understand section purpose quickly.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Enter` | Toggles accordion section. |
| `Space` | Toggles accordion section. |
| `Tab` | Moves focus to next focusable element in page order. |
| `Shift + Tab` | Moves focus to previous focusable element in page order. |

