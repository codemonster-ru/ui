# Features

## Summary

Sliding panel for secondary workflows and contextual actions.

## Import

```ts
import { VfDrawer } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfDrawer v-model:open="open" title="Filters" size="sm">
    <p style="margin:0 0 12px">Update search filters for the list.</p>
    <template #footer="{ close }">
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button @click="close">Close</button>
      </div>
    </template>
  </VfDrawer>
</template>

<script setup>
import { ref } from 'vue';
import { VfDrawer } from '@codemonster-ru/vueforge-core';

const open = ref(true);
</script>
```
````

## Accessibility

### Screen Reader

- Drawer surface is rendered as `role="dialog"` with `aria-modal="true"`.
- Accessible name is provided via `aria-labelledby` from drawer title/header.
- Include a meaningful title to announce drawer purpose when it opens.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to next focusable element inside drawer (focus is trapped while open). |
| `Shift + Tab` | Moves focus to previous focusable element inside drawer. |
| `Escape` | Closes drawer when `closeOnEscape` is enabled. |
| `Enter` | Activates focused action (for example, close/apply buttons). |

