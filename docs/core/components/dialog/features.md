# Features

Overlay dialog for confirmations and focused workflows.

## Summary

Overlay dialog for confirmations and focused workflows.

## Import

```ts
import { VfDialog } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfButton @click="open = true">Open Dialog</VfButton>
  <VfDialog v-model:open="open" title="Delete item?">
    This action cannot be undone.
  </VfDialog>
</template>

<script setup>
import { ref } from 'vue';
import { VfButton, VfDialog } from '@codemonster-ru/vueforge-core';

const open = ref(false);
</script>
```
````

## Accessibility

### Screen Reader

- Dialog content is rendered with `role="dialog"` and `aria-modal="true"`.
- The accessible name is linked through `aria-labelledby` (title) and optional description through `aria-describedby`.
- Provide a meaningful `title` (or `header` slot) and description so screen readers announce context immediately when opened.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to the next focusable element inside the dialog (focus is trapped while open). |
| `Shift + Tab` | Moves focus to the previous focusable element inside the dialog. |
| `Escape` | Closes the dialog when `closeOnEscape` is enabled. |
| `Enter` | Activates the currently focused action (for example, confirm/submit buttons). |

