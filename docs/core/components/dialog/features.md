# Features

Overlay dialog for confirmations and focused workflows.

## Import

Import statement for this component.

```ts
import { VfDialog } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfButton @click="open = true">Open Dialog</VfButton>
  <VfDialog v-model:open="open" title="Delete item?" :disable-teleport="true">
    This action cannot be undone.
  </VfDialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { VfButton, VfDialog } from '@codemonster-ru/vueforge-core';

const open = ref(false);

const unlockPageScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

watch(open, (value) => {
  if (!value) return;
  requestAnimationFrame(unlockPageScroll);
});
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Dialog content is rendered with `role="dialog"` and `aria-modal="true"`.
- The accessible name is linked through `aria-labelledby` (title) and optional description through `aria-describedby`.
- Provide a meaningful `title` (or `header` slot) and description so screen readers announce context immediately when opened.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to the next focusable element inside the dialog (focus is trapped while open). |
| `Shift + Tab` | Moves focus to the previous focusable element inside the dialog. |
| `Escape` | Closes the dialog when `closeOnEscape` is enabled. |
| `Enter` | Activates the currently focused action (for example, confirm/submit buttons). |
